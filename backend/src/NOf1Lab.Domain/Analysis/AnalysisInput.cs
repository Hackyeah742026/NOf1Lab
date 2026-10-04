using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Analysis;

public sealed record AnalysisCheckIn(
    DateOnly Day,
    ExperimentPhase Phase,
    decimal MetricValue,
    bool Adhered,
    bool SafetyFlag = false);

public sealed record AnalysisInput(
    IReadOnlyList<AnalysisCheckIn> CheckIns,
    bool HigherIsBetter,
    decimal MinAdherencePercent = 60m,
    int MinSamplesPerPhase = 3,
    decimal KeepThreshold = 0.3m,
    decimal DropThreshold = -0.15m);
