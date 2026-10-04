using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Entities;

public class Experiment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string TemplateKey { get; set; } = string.Empty;
    public ExperimentTemplate? Template { get; set; }
    public string Hypothesis { get; set; } = string.Empty;
    public ExperimentStatus Status { get; set; } = ExperimentStatus.Draft;
    public DateOnly? StartDate { get; set; }
    public DateOnly? PhaseAEnd { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? StopReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public List<CheckIn> CheckIns { get; set; } = [];
    public ExperimentResult? Result { get; set; }
}
