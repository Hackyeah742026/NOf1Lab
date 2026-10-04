namespace NOf1Lab.Domain.Analysis;

public sealed record ConfidenceStats(
    decimal PValue,
    decimal CiLow,
    decimal CiHigh,
    string Strength,
    int Permutations,
    bool ExactPermutation);

public sealed record ReliabilityWarning(string Code, string Message);

/// <summary>
/// Deterministic uncertainty + data-quality checks layered on top of the verdict.
/// Uses a fixed RNG seed so the same check-ins always yield the same numbers.
/// </summary>
public static class ReliabilityAnalyzer
{
    private const int Seed = 20261004;
    private const int MaxExactCombinations = 20_000;
    private const int RandomPermutations = 10_000;
    private const int BootstrapResamples = 4_000;

    public const decimal LowAdherenceWarningPercent = 70m;
    public const int LowSampleWarningCount = 5;

    /// <summary>Two-sided permutation p-value for the difference in means plus a 95% bootstrap CI of B − A.</summary>
    public static ConfidenceStats Confidence(IReadOnlyList<double> a, IReadOnlyList<double> b)
    {
        var observed = Math.Abs(b.Average() - a.Average());
        var pooled = a.Concat(b).ToArray();
        var nA = a.Count;
        var total = pooled.Length;
        var sum = pooled.Sum();

        int extreme = 0;
        int permutations;
        bool exact;
        var combinations = Binomial(total, nA);

        if (combinations <= MaxExactCombinations)
        {
            exact = true;
            permutations = 0;
            foreach (var subsetSum in SubsetSums(pooled, nA))
            {
                permutations++;
                var diff = Math.Abs((sum - subsetSum) / (total - nA) - subsetSum / nA);
                if (diff >= observed - 1e-9) extreme++;
            }
        }
        else
        {
            exact = false;
            permutations = RandomPermutations;
            var rng = new Random(Seed);
            var buffer = (double[])pooled.Clone();
            for (var i = 0; i < permutations; i++)
            {
                Shuffle(buffer, rng);
                double subsetSum = 0;
                for (var j = 0; j < nA; j++) subsetSum += buffer[j];
                var diff = Math.Abs((sum - subsetSum) / (total - nA) - subsetSum / nA);
                if (diff >= observed - 1e-9) extreme++;
            }
            // Include the observed labelling so p is never exactly 0.
            extreme++;
            permutations++;
        }

        var pValue = (double)extreme / permutations;

        var (ciLow, ciHigh) = BootstrapCi(a, b);

        var strength = pValue < 0.05 ? "strong" : pValue < 0.15 ? "moderate" : "weak";

        return new ConfidenceStats(
            Round(pValue),
            Round(ciLow),
            Round(ciHigh),
            strength,
            permutations,
            exact);
    }

    public static IReadOnlyList<ReliabilityWarning> Warnings(
        IReadOnlyList<AnalysisCheckIn> phaseA,
        IReadOnlyList<AnalysisCheckIn> phaseB,
        decimal adherenceA,
        decimal adherenceB,
        decimal delta)
    {
        var warnings = new List<ReliabilityWarning>();

        if (phaseA.Count < LowSampleWarningCount || phaseB.Count < LowSampleWarningCount)
        {
            warnings.Add(new ReliabilityWarning(
                "LowSamples",
                $"Only {phaseA.Count} days in A and {phaseB.Count} in B. Aim for at least {LowSampleWarningCount} per phase for a stable read."));
        }

        if (adherenceA < LowAdherenceWarningPercent || adherenceB < LowAdherenceWarningPercent)
        {
            warnings.Add(new ReliabilityWarning(
                "LowAdherence",
                $"Protocol was followed on fewer than {LowAdherenceWarningPercent:0}% of days in at least one phase, so the phases blur together."));
        }

        var drift = BaselineDrift(phaseA);
        if (drift is { } r && phaseA.Count >= 4 && Math.Abs(r) >= 0.7 && Math.Sign(r) == Math.Sign((double)delta) && delta != 0)
        {
            warnings.Add(new ReliabilityWarning(
                "BaselineTrend",
                "Your baseline was already trending in the same direction before the change. Part of the difference may be a trend, not the intervention."));
        }

        var safety = phaseA.Count(c => c.SafetyFlag) + phaseB.Count(c => c.SafetyFlag);
        if (safety > 0)
        {
            warnings.Add(new ReliabilityWarning(
                "SafetyFlags",
                $"You flagged a safety concern on {safety} day{(safety == 1 ? "" : "s")}. Talk to a professional before continuing this habit."));
        }

        return warnings;
    }

    /// <summary>Pearson correlation between day order and value within phase A.</summary>
    private static double? BaselineDrift(IReadOnlyList<AnalysisCheckIn> phaseA)
    {
        if (phaseA.Count < 3) return null;
        var ordered = phaseA.OrderBy(c => c.Day).Select(c => (double)c.MetricValue).ToArray();
        var xs = Enumerable.Range(0, ordered.Length).Select(i => (double)i).ToArray();
        var mx = xs.Average();
        var my = ordered.Average();
        double sxy = 0, sxx = 0, syy = 0;
        for (var i = 0; i < ordered.Length; i++)
        {
            sxy += (xs[i] - mx) * (ordered[i] - my);
            sxx += (xs[i] - mx) * (xs[i] - mx);
            syy += (ordered[i] - my) * (ordered[i] - my);
        }
        if (sxx == 0 || syy == 0) return null;
        return sxy / Math.Sqrt(sxx * syy);
    }

    private static (double Low, double High) BootstrapCi(IReadOnlyList<double> a, IReadOnlyList<double> b)
    {
        var rng = new Random(Seed + 1);
        var diffs = new double[BootstrapResamples];
        for (var i = 0; i < BootstrapResamples; i++)
        {
            diffs[i] = ResampleMean(b, rng) - ResampleMean(a, rng);
        }
        Array.Sort(diffs);
        return (Percentile(diffs, 0.025), Percentile(diffs, 0.975));
    }

    private static double ResampleMean(IReadOnlyList<double> values, Random rng)
    {
        double total = 0;
        for (var i = 0; i < values.Count; i++) total += values[rng.Next(values.Count)];
        return total / values.Count;
    }

    private static double Percentile(double[] sorted, double q)
    {
        var position = q * (sorted.Length - 1);
        var lower = (int)Math.Floor(position);
        var upper = (int)Math.Ceiling(position);
        return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
    }

    /// <summary>Sums of every k-element subset (exact permutation distribution).</summary>
    private static IEnumerable<double> SubsetSums(double[] values, int k)
    {
        var indices = Enumerable.Range(0, k).ToArray();
        var n = values.Length;
        while (true)
        {
            double s = 0;
            foreach (var i in indices) s += values[i];
            yield return s;

            var pos = k - 1;
            while (pos >= 0 && indices[pos] == n - k + pos) pos--;
            if (pos < 0) yield break;
            indices[pos]++;
            for (var j = pos + 1; j < k; j++) indices[j] = indices[j - 1] + 1;
        }
    }

    private static double Binomial(int n, int k)
    {
        double result = 1;
        for (var i = 1; i <= k; i++) result = result * (n - k + i) / i;
        return result;
    }

    private static void Shuffle(double[] values, Random rng)
    {
        for (var i = values.Length - 1; i > 0; i--)
        {
            var j = rng.Next(i + 1);
            (values[i], values[j]) = (values[j], values[i]);
        }
    }

    private static decimal Round(double value) =>
        Math.Round((decimal)value, 3, MidpointRounding.AwayFromZero);
}
