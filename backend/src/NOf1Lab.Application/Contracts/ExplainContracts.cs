namespace NOf1Lab.Application.Contracts;

public sealed record ExplainDto(
    string Explanation,
    string? SuggestedNextTemplateKey,
    IReadOnlyList<string> EvidenceKeys,
    bool UsedFallback);
