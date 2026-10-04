using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Domain.Common;
using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Application.Services;

public sealed class TemplateService(IAppDbContext db)
{
    public async Task<Result<IReadOnlyList<TemplateDto>>> ListAsync(CancellationToken ct = default)
    {
        var templates = await db.Templates.AsNoTracking()
            .OrderBy(t => t.Title)
            .ToListAsync(ct);

        return Result<IReadOnlyList<TemplateDto>>.Ok(templates.Select(ToDto).ToList());
    }

    public async Task<Result<TemplateDto>> GetAsync(string key, CancellationToken ct = default)
    {
        var template = await db.Templates.AsNoTracking().SingleOrDefaultAsync(t => t.Key == key, ct);
        if (template is null)
        {
            return Result<TemplateDto>.Fail(Error.NotFound("Template.NotFound", "Template was not found."));
        }

        return Result<TemplateDto>.Ok(ToDto(template));
    }

    private static TemplateDto ToDto(ExperimentTemplate t) =>
        new(t.Key, t.Title, t.Question, t.Description, t.Category, t.MetricKey, t.MetricLabel,
            t.DaysPerPhase, t.PhaseALabel, t.PhaseBLabel, t.HigherIsBetter);
}
