namespace NOf1Lab.Domain.Entities;

public class ExperimentTemplate
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string MetricKey { get; set; } = string.Empty;
    public string MetricLabel { get; set; } = string.Empty;
    public int DaysPerPhase { get; set; } = 7;
    public string PhaseALabel { get; set; } = "Baseline";
    public string PhaseBLabel { get; set; } = "Intervention";
    public bool HigherIsBetter { get; set; } = true;
}
