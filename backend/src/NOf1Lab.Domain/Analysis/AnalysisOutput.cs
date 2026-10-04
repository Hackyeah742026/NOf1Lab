using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Analysis;

public sealed record AnalysisOutput(
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
