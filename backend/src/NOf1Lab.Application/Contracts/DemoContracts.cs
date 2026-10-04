using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Application.Contracts;

public sealed record DemoShowcaseDto(
    Guid ExperimentId,
    string TemplateKey,
    string? TemplateTitle,
    Verdict Verdict,
    ExperimentStatus Status);
