namespace NOf1Lab.Application.Abstractions;

public sealed record ExplainRequest(
    string TemplateTitle,
    string Hypothesis,
    string Verdict,
    decimal MeanA,
    decimal MeanB,
    decimal Delta,
    decimal EffectSize,
    decimal AdherenceA,
    decimal AdherenceB,
    int SampleSizeA,
    int SampleSizeB,
    string Language);

public sealed record ExplainResponse(
    string Explanation,
    string? SuggestedNextTemplateKey,
    IReadOnlyList<string> EvidenceKeys,
    bool UsedFallback);

public interface IAiExplainer
{
    Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default);
}
