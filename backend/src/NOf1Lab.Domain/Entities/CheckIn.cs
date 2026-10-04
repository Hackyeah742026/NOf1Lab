using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Entities;

public class CheckIn
{
    public Guid Id { get; set; }
    public Guid ExperimentId { get; set; }
    public Experiment? Experiment { get; set; }
    public DateOnly Day { get; set; }
    public ExperimentPhase Phase { get; set; }
    public decimal MetricValue { get; set; }
    public bool Adhered { get; set; }
    public string? Notes { get; set; }
    public bool SafetyFlag { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
