using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Application.Contracts;

public sealed record CreateExperimentRequest(string TemplateKey, string? Hypothesis);
public sealed record CreateCheckInRequest(
    DateOnly? Day,
    decimal MetricValue,
    bool Adhered,
    string? Notes,
    bool SafetyFlag);

public sealed record CheckInDto(
    Guid Id,
    DateOnly Day,
    ExperimentPhase Phase,
    decimal MetricValue,
    bool Adhered,
    string? Notes,
    bool SafetyFlag);

public sealed record ExperimentResultDto(
    Guid ExperimentId,
    decimal MeanA,
    decimal MeanB,
    decimal Delta,
    decimal EffectSize,
    decimal AdherenceA,
    decimal AdherenceB,
    int SampleSizeA,
    int SampleSizeB,
    Verdict Verdict,
    string EvidenceJson);

public sealed record ExperimentDto(
    Guid Id,
    string TemplateKey,
    string? TemplateTitle,
    string Hypothesis,
    ExperimentStatus Status,
    DateOnly? StartDate,
    DateOnly? PhaseAEnd,
    DateOnly? EndDate,
    string? StopReason,
    int CheckInCount,
    ExperimentResultDto? Result);
