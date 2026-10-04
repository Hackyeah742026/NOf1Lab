using NOf1Lab.Domain.Analysis;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Tests.Analysis;

public class ExperimentAnalyzerTests
{
    [Fact]
    public void Analyze_Keep_WhenInterventionImprovesMetric()
    {
        var input = new AnalysisInput(CreateCheckIns(
            [5, 5, 4.5m, 5.5m, 5],
            [7, 7.5m, 7, 8, 7.5m]), HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(Verdict.Keep, result.Value.Verdict);
        Assert.True(result.Value.MeanB > result.Value.MeanA);
        Assert.Equal(100m, result.Value.AdherenceA);
    }

    [Fact]
    public void Analyze_Drop_WhenInterventionWorsensMetric()
    {
        var input = new AnalysisInput(CreateCheckIns(
            [7, 7.5m, 7, 8, 7],
            [4, 4.5m, 5, 4, 4.5m]), HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(Verdict.Drop, result.Value.Verdict);
    }

    [Fact]
    public void Analyze_Inconclusive_WhenSampleTooSmall()
    {
        var input = new AnalysisInput(
        [
            new(new DateOnly(2026, 1, 1), ExperimentPhase.A, 5, true),
            new(new DateOnly(2026, 1, 2), ExperimentPhase.A, 6, true),
            new(new DateOnly(2026, 1, 3), ExperimentPhase.B, 8, true),
            new(new DateOnly(2026, 1, 4), ExperimentPhase.B, 7, true)
        ], HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(Verdict.Inconclusive, result.Value.Verdict);
    }

    [Fact]
    public void Analyze_Fails_WhenPhaseMissing()
    {
        var input = new AnalysisInput(
        [
            new(new DateOnly(2026, 1, 1), ExperimentPhase.A, 5, true),
            new(new DateOnly(2026, 1, 2), ExperimentPhase.A, 6, true)
        ], HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsFailure);
        Assert.Contains(result.Errors, e => e.Code == "Analysis.MissingPhases");
    }

    private static List<AnalysisCheckIn> CreateCheckIns(decimal[] phaseA, decimal[] phaseB)
    {
        var start = new DateOnly(2026, 1, 1);
        var rows = new List<AnalysisCheckIn>();
        for (var i = 0; i < phaseA.Length; i++)
        {
            rows.Add(new AnalysisCheckIn(start.AddDays(i), ExperimentPhase.A, phaseA[i], true));
        }

        for (var i = 0; i < phaseB.Length; i++)
        {
            rows.Add(new AnalysisCheckIn(start.AddDays(phaseA.Length + i), ExperimentPhase.B, phaseB[i], true));
        }

        return rows;
    }
}
