using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Domain.Common;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Application.Services;

public sealed class DemoService(IAppDbContext db)
{
    private const string PreferredTemplateKey = "earlier-bedtime";

    public async Task<Result<DemoShowcaseDto>> GetShowcaseAsync(Guid userId, CancellationToken ct = default)
    {
        var completed = (await db.Experiments.AsNoTracking()
                .Include(e => e.Template)
                .Include(e => e.Result)
                .Where(e => e.UserId == userId && e.Status == ExperimentStatus.Completed)
                .ToListAsync(ct))
            .Where(e => e.Result is not null)
            .OrderByDescending(e => e.CreatedAt)
            .ToList();

        var showcase = completed.FirstOrDefault(e => e.TemplateKey == PreferredTemplateKey)
                       ?? completed.FirstOrDefault();

        if (showcase?.Result is null)
        {
            return Result<DemoShowcaseDto>.Fail(
                Error.NotFound("Demo.ShowcaseNotFound", "No completed experiment with a result is available to showcase."));
        }

        return Result<DemoShowcaseDto>.Ok(new DemoShowcaseDto(
            showcase.Id,
            showcase.TemplateKey,
            showcase.Template?.Title,
            showcase.Result.Verdict,
            showcase.Status));
    }
}
