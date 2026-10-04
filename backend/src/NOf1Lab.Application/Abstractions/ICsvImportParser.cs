using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Application.Abstractions;

public sealed record ImportedCheckInRow(
    DateOnly Day,
    ExperimentPhase Phase,
    decimal MetricValue,
    bool Adhered,
    string? Notes,
    bool SafetyFlag);

public interface ICsvImportParser
{
    IReadOnlyList<ImportedCheckInRow> Parse(Stream csvStream);
}
