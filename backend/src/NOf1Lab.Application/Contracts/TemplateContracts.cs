namespace NOf1Lab.Application.Contracts;

public sealed record TemplateDto(
    string Key,
    string Title,
    string Question,
    string Description,
    string Category,
    string MetricKey,
    string MetricLabel,
    int DaysPerPhase,
    string PhaseALabel,
    string PhaseBLabel,
    bool HigherIsBetter);
