using NOf1Lab.Domain.Analysis;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Tests.Analysis;

/// <summary>
/// Domain scenarios the mid-run GET .../analysis/preview endpoint relies on
/// (provisional Keep vs thin-sample Inconclusive) without completing the experiment.
/// </summary>
public class AnalysisPreviewScenarioTests
{
    [Fact]
    public void ProvisionalPreview_Keep_WhenBothPhasesHaveStrongSignal()
    {
        var input = new AnalysisInput(CreateCheckIns(
            [5, 5, 4.5m, 5.5m, 5],
            [7, 7.5m, 7, 8, 7.5m]), HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(Verdict.Keep, result.Value.Verdict);
        Assert.Equal(5, result.Value.SampleSizeA);
        Assert.Equal(5, result.Value.SampleSizeB);
        Assert.True(result.Value.MeanB > result.Value.MeanA);
        Assert.False(string.IsNullOrWhiteSpace(result.Value.EvidenceJson));
    }

    [Fact]
    public void ProvisionalPreview_Inconclusive_WhenSamplesAreThin()
    {
        var input = new AnalysisInput(
        [
            new(new DateOnly(2026, 3, 1), ExperimentPhase.A, 5, true),
            new(new DateOnly(2026, 3, 2), ExperimentPhase.A, 6, true),
            new(new DateOnly(2026, 3, 3), ExperimentPhase.B, 9, true),
            new(new DateOnly(2026, 3, 4), ExperimentPhase.B, 8, true)
        ], HigherIsBetter: true);

        var result = ExperimentAnalyzer.Analyze(input);

        Assert.True(result.IsSuccess);
        Assert.Equal(Verdict.Inconclusive, result.Value.Verdict);
        Assert.Equal(2, result.Value.SampleSizeA);
        Assert.Equal(2, result.Value.SampleSizeB);
        Assert.False(string.IsNullOrWhiteSpace(result.Value.EvidenceJson));
    }

    private static List<AnalysisCheckIn> CreateCheckIns(decimal[] phaseA, decimal[] phaseB)
    {
        var start = new DateOnly(2026, 3, 1);
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
