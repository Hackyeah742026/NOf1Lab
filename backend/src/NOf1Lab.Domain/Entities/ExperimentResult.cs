using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Entities;

public class ExperimentResult
{
    public Guid Id { get; set; }
    public Guid ExperimentId { get; set; }
    public Experiment? Experiment { get; set; }
    public decimal MeanA { get; set; }
    public decimal MeanB { get; set; }
    public decimal Delta { get; set; }
    public decimal EffectSize { get; set; }
    public decimal AdherenceA { get; set; }
    public decimal AdherenceB { get; set; }
    public int SampleSizeA { get; set; }
    public int SampleSizeB { get; set; }
    public Verdict Verdict { get; set; }
    public string EvidenceJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }
}
