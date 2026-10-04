using System.Text.Json;
using NOf1Lab.Domain.Common;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Analysis;

public static class ExperimentAnalyzer
{
    public static Result<AnalysisOutput> Analyze(AnalysisInput input)
    {
        var phaseA = input.CheckIns.Where(c => c.Phase == ExperimentPhase.A).ToList();
        var phaseB = input.CheckIns.Where(c => c.Phase == ExperimentPhase.B).ToList();

        if (phaseA.Count == 0 || phaseB.Count == 0)
        {
            return Result<AnalysisOutput>.Fail(
                Error.Validation("Analysis.MissingPhases", "Both phase A and phase B need check-ins."));
        }

        var meanA = Average(phaseA.Select(c => c.MetricValue));
        var meanB = Average(phaseB.Select(c => c.MetricValue));
        var delta = meanB - meanA;
        var pooledSd = PooledStandardDeviation(phaseA.Select(c => c.MetricValue), phaseB.Select(c => c.MetricValue));
        var effectSize = pooledSd == 0 ? 0 : delta / pooledSd;
        var adherenceA = AdherencePercent(phaseA);
        var adherenceB = AdherencePercent(phaseB);

        var directionalEffect = input.HigherIsBetter ? effectSize : -effectSize;
        var verdict = DecideVerdict(
            directionalEffect,
            adherenceA,
            adherenceB,
            phaseA.Count,
            phaseB.Count,
            input);

        var confidence = ReliabilityAnalyzer.Confidence(
            phaseA.Select(c => (double)c.MetricValue).ToList(),
            phaseB.Select(c => (double)c.MetricValue).ToList());
        var warnings = ReliabilityAnalyzer.Warnings(phaseA, phaseB, adherenceA, adherenceB, delta);

        var evidence = new
        {
            meanA,
            meanB,
            delta,
            effectSize,
            directionalEffect,
            adherenceA,
            adherenceB,
            sampleSizeA = phaseA.Count,
            sampleSizeB = phaseB.Count,
            higherIsBetter = input.HigherIsBetter,
            verdict = verdict.ToString(),
            confidence = new
            {
                pValue = confidence.PValue,
                ciLow = confidence.CiLow,
                ciHigh = confidence.CiHigh,
                strength = confidence.Strength,
                method = confidence.ExactPermutation ? "exact permutation test + bootstrap 95% CI" : "permutation test + bootstrap 95% CI",
                permutations = confidence.Permutations
            },
            warnings = warnings.Select(w => new { code = w.Code, message = w.Message }).ToList(),
            rules = new
            {
                input.MinAdherencePercent,
                input.MinSamplesPerPhase,
                input.KeepThreshold,
                input.DropThreshold
            }
        };

        var output = new AnalysisOutput(
            MeanA: Round(meanA),
            MeanB: Round(meanB),
            Delta: Round(delta),
            EffectSize: Round(effectSize),
            AdherenceA: Round(adherenceA),
            AdherenceB: Round(adherenceB),
            SampleSizeA: phaseA.Count,
            SampleSizeB: phaseB.Count,
            Verdict: verdict,
            EvidenceJson: JsonSerializer.Serialize(evidence));

        return Result<AnalysisOutput>.Ok(output);
    }

    private static Verdict DecideVerdict(
        decimal directionalEffect,
        decimal adherenceA,
        decimal adherenceB,
        int sampleA,
        int sampleB,
        AnalysisInput input)
    {
        if (sampleA < input.MinSamplesPerPhase || sampleB < input.MinSamplesPerPhase)
        {
            return Verdict.Inconclusive;
        }

        if (adherenceA < input.MinAdherencePercent || adherenceB < input.MinAdherencePercent)
        {
            return Verdict.Inconclusive;
        }

        if (directionalEffect >= input.KeepThreshold)
        {
            return Verdict.Keep;
        }

        if (directionalEffect <= input.DropThreshold)
        {
            return Verdict.Drop;
        }

        if (Math.Abs(directionalEffect) < 0.1m)
        {
            return Verdict.Inconclusive;
        }

        return Verdict.Modify;
    }

    private static decimal Average(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : list.Average();
    }

    private static decimal AdherencePercent(IReadOnlyCollection<AnalysisCheckIn> checkIns)
    {
        if (checkIns.Count == 0)
        {
            return 0;
        }

        var adhered = checkIns.Count(c => c.Adhered);
        return adhered * 100m / checkIns.Count;
    }

    private static decimal PooledStandardDeviation(IEnumerable<decimal> a, IEnumerable<decimal> b)
    {
        var listA = a.ToList();
        var listB = b.ToList();
        var varianceA = Variance(listA);
        var varianceB = Variance(listB);
        var nA = listA.Count;
        var nB = listB.Count;

        if (nA + nB <= 2)
        {
            return 0;
        }

        var pooledVariance = ((nA - 1) * varianceA + (nB - 1) * varianceB) / (nA + nB - 2);
        return (decimal)Math.Sqrt((double)pooledVariance);
    }

    private static decimal Variance(IReadOnlyList<decimal> values)
    {
        if (values.Count < 2)
        {
            return 0;
        }

        var mean = values.Average();
        return values.Sum(v => (v - mean) * (v - mean)) / (values.Count - 1);
    }

    private static decimal Round(decimal value) =>
        Math.Round(value, 3, MidpointRounding.AwayFromZero);
}
