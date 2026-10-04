using System.Text.Json;
using NOf1Lab.Domain.Analysis;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Tests.Analysis;

public class ReliabilityAnalyzerTests
{
    [Fact]
    public void Confidence_ClearSeparation_IsStrongAndCiExcludesZero()
    {
        var stats = ReliabilityAnalyzer.Confidence(
            [5, 5.5, 4.5, 5, 6],
            [7, 7.5, 6.5, 8, 7]);

        Assert.True(stats.ExactPermutation);
        Assert.Equal(252, stats.Permutations);
        Assert.True(stats.PValue < 0.05m);
        Assert.Equal("strong", stats.Strength);
        Assert.True(stats.CiLow > 0);
        Assert.True(stats.CiHigh > stats.CiLow);
    }

    [Fact]
    public void Confidence_NoDifference_IsWeak()
    {
        var stats = ReliabilityAnalyzer.Confidence(
            [5, 6, 5, 6, 5],
            [6, 5, 6, 5, 5]);

        Assert.Equal("weak", stats.Strength);
        Assert.True(stats.CiLow < 0 && stats.CiHigh > 0);
    }

    [Fact]
    public void Confidence_IsDeterministic_ForLargeSamples()
    {
        var a = Enumerable.Range(0, 14).Select(i => 5.0 + i % 3 * 0.5).ToList();
        var b = Enumerable.Range(0, 14).Select(i => 5.6 + i % 4 * 0.5).ToList();

        var first = ReliabilityAnalyzer.Confidence(a, b);
        var second = ReliabilityAnalyzer.Confidence(a, b);

        Assert.False(first.ExactPermutation);
        Assert.Equal(first, second);
    }

    [Fact]
    public void Warnings_FlagSmallSamplesLowAdherenceAndSafety()
    {
        var start = new DateOnly(2026, 1, 1);
        var a = new List<AnalysisCheckIn>
        {
            new(start, ExperimentPhase.A, 5, true),
            new(start.AddDays(1), ExperimentPhase.A, 5, false),
            new(start.AddDays(2), ExperimentPhase.A, 6, false),
        };
        var b = new List<AnalysisCheckIn>
        {
            new(start.AddDays(3), ExperimentPhase.B, 7, true, SafetyFlag: true),
            new(start.AddDays(4), ExperimentPhase.B, 7, true),
            new(start.AddDays(5), ExperimentPhase.B, 8, true),
        };

        var warnings = ReliabilityAnalyzer.Warnings(a, b, adherenceA: 33.3m, adherenceB: 100m, delta: 2m);
        var codes = warnings.Select(w => w.Code).ToList();

        Assert.Contains("LowSamples", codes);
        Assert.Contains("LowAdherence", codes);
        Assert.Contains("SafetyFlags", codes);
    }

    [Fact]
    public void Warnings_FlagBaselineTrend_InSameDirectionAsChange()
    {
        var start = new DateOnly(2026, 1, 1);
        var a = new[] { 4m, 5m, 6m, 7m, 8m }
            .Select((v, i) => new AnalysisCheckIn(start.AddDays(i), ExperimentPhase.A, v, true)).ToList();
        var b = new[] { 8m, 8.5m, 9m, 8m, 9m }
            .Select((v, i) => new AnalysisCheckIn(start.AddDays(5 + i), ExperimentPhase.B, v, true)).ToList();

        var warnings = ReliabilityAnalyzer.Warnings(a, b, 100m, 100m, delta: 2.5m);

        Assert.Contains(warnings, w => w.Code == "BaselineTrend");
    }

    [Fact]
    public void Analyze_EmbedsConfidenceAndWarnings_InEvidence()
    {
        var start = new DateOnly(2026, 1, 1);
        var rows = new[] { 5m, 5.5m, 4.5m, 5m, 6m }
            .Select((v, i) => new AnalysisCheckIn(start.AddDays(i), ExperimentPhase.A, v, true))
            .Concat(new[] { 7m, 7.5m, 6.5m, 8m, 7m }
                .Select((v, i) => new AnalysisCheckIn(start.AddDays(5 + i), ExperimentPhase.B, v, true)))
            .ToList();

        var result = ExperimentAnalyzer.Analyze(new AnalysisInput(rows, HigherIsBetter: true));

        using var doc = JsonDocument.Parse(result.Value.EvidenceJson);
        var confidence = doc.RootElement.GetProperty("confidence");
        Assert.Equal("strong", confidence.GetProperty("strength").GetString());
        Assert.Equal(JsonValueKind.Array, doc.RootElement.GetProperty("warnings").ValueKind);
        Assert.Equal(Verdict.Keep, result.Value.Verdict);
    }
}
