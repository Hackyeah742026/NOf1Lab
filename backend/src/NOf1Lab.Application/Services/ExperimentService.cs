using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Domain.Analysis;
using NOf1Lab.Domain.Common;
using NOf1Lab.Domain.Entities;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Application.Services;

public sealed class ExperimentService(IAppDbContext db, ICsvImportParser csvImportParser)
{
    public async Task<Result<ExperimentDto>> CreateAsync(Guid userId, CreateExperimentRequest request, CancellationToken ct = default)
    {
        var template = await db.Templates.AsNoTracking()
            .SingleOrDefaultAsync(t => t.Key == request.TemplateKey, ct);
        if (template is null)
        {
            return Result<ExperimentDto>.Fail(Error.NotFound("Template.NotFound", "Template was not found."));
        }

        var experiment = new Experiment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TemplateKey = template.Key,
            Hypothesis = string.IsNullOrWhiteSpace(request.Hypothesis) ? template.Question : request.Hypothesis.Trim(),
            Status = ExperimentStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Experiments.Add(experiment);
        await db.SaveChangesAsync(ct);

        return Result<ExperimentDto>.Ok(ToDto(experiment, template.Title, 0, null));
    }

    public async Task<Result<IReadOnlyList<ExperimentDto>>> ListAsync(Guid userId, CancellationToken ct = default)
    {
        var experiments = (await db.Experiments.AsNoTracking()
            .Include(e => e.Template)
            .Include(e => e.Result)
            .Where(e => e.UserId == userId)
            .ToListAsync(ct))
            .OrderByDescending(e => e.CreatedAt)
            .ToList();

        var ids = experiments.Select(e => e.Id).ToList();
        var counts = await db.CheckIns.AsNoTracking()
            .Where(c => ids.Contains(c.ExperimentId))
            .GroupBy(c => c.ExperimentId)
            .Select(g => new { ExperimentId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var countMap = counts.ToDictionary(x => x.ExperimentId, x => x.Count);
        var dtos = experiments.Select(e =>
            ToDto(e, e.Template?.Title, countMap.GetValueOrDefault(e.Id), e.Result is null ? null : ToResultDto(e.Result))).ToList();

        return Result<IReadOnlyList<ExperimentDto>>.Ok(dtos);
    }

    public async Task<Result<ExperimentDto>> GetAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, id, ct);
        if (experiment is null)
        {
            return Result<ExperimentDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        return Result<ExperimentDto>.Ok(ToDto(
            experiment,
            experiment.Template?.Title,
            experiment.CheckIns.Count,
            experiment.Result is null ? null : ToResultDto(experiment.Result)));
    }

    public async Task<Result<ExperimentDto>> StartAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, id, ct);
        if (experiment is null)
        {
            return Result<ExperimentDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Status != ExperimentStatus.Draft)
        {
            return Result<ExperimentDto>.Fail(Error.Conflict("Experiment.InvalidStatus", "Only draft experiments can be started."));
        }

        var days = experiment.Template?.DaysPerPhase ?? 7;
        var start = DateOnly.FromDateTime(DateTime.UtcNow);
        experiment.Status = ExperimentStatus.Active;
        experiment.StartDate = start;
        experiment.PhaseAEnd = start.AddDays(days - 1);
        experiment.EndDate = start.AddDays(days * 2 - 1);

        await db.SaveChangesAsync(ct);
        return await GetAsync(userId, id, ct);
    }

    public async Task<Result<ExperimentDto>> StopAsync(Guid userId, Guid id, string? reason, CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, id, ct);
        if (experiment is null)
        {
            return Result<ExperimentDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Status != ExperimentStatus.Active)
        {
            return Result<ExperimentDto>.Fail(Error.Conflict("Experiment.InvalidStatus", "Only active experiments can be stopped."));
        }

        experiment.Status = ExperimentStatus.Stopped;
        experiment.StopReason = string.IsNullOrWhiteSpace(reason)
            ? "Stopped by user."
            : reason.Trim();

        await db.SaveChangesAsync(ct);
        return await GetAsync(userId, id, ct);
    }

    public async Task<Result<CheckInDto>> AddCheckInAsync(
        Guid userId,
        Guid experimentId,
        CreateCheckInRequest request,
        CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, experimentId, ct);
        if (experiment is null)
        {
            return Result<CheckInDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Status != ExperimentStatus.Active)
        {
            return Result<CheckInDto>.Fail(Error.Conflict("Experiment.NotActive", "Check-ins require an active experiment."));
        }

        if (experiment.StartDate is null || experiment.PhaseAEnd is null || experiment.EndDate is null)
        {
            return Result<CheckInDto>.Fail(Error.Conflict("Experiment.NotScheduled", "Experiment schedule is incomplete."));
        }

        var day = request.Day ?? DateOnly.FromDateTime(DateTime.UtcNow);
        if (day < experiment.StartDate || day > experiment.EndDate)
        {
            return Result<CheckInDto>.Fail(Error.Validation("CheckIn.OutOfRange", "Check-in day is outside the experiment window."));
        }

        if (experiment.CheckIns.Any(c => c.Day == day))
        {
            return Result<CheckInDto>.Fail(Error.Conflict("CheckIn.DuplicateDay", "A check-in for this day already exists."));
        }

        var phase = day <= experiment.PhaseAEnd ? ExperimentPhase.A : ExperimentPhase.B;
        var checkIn = new CheckIn
        {
            Id = Guid.NewGuid(),
            ExperimentId = experiment.Id,
            Day = day,
            Phase = phase,
            MetricValue = request.MetricValue,
            Adhered = request.Adhered,
            Notes = request.Notes?.Trim(),
            SafetyFlag = request.SafetyFlag,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.CheckIns.Add(checkIn);

        if (request.SafetyFlag)
        {
            experiment.Status = ExperimentStatus.Stopped;
            experiment.StopReason =
                "Safety stop: seek professional care if you feel unwell. N-of-1 Lab does not diagnose or treat medical conditions.";
        }

        await db.SaveChangesAsync(ct);
        return Result<CheckInDto>.Ok(ToCheckInDto(checkIn));
    }

    public async Task<Result<IReadOnlyList<CheckInDto>>> ListCheckInsAsync(
        Guid userId,
        Guid experimentId,
        CancellationToken ct = default)
    {
        var experiment = await db.Experiments.AsNoTracking()
            .SingleOrDefaultAsync(e => e.Id == experimentId && e.UserId == userId, ct);
        if (experiment is null)
        {
            return Result<IReadOnlyList<CheckInDto>>.Fail(
                Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        var checkIns = await db.CheckIns.AsNoTracking()
            .Where(c => c.ExperimentId == experimentId)
            .OrderBy(c => c.Day)
            .ToListAsync(ct);

        return Result<IReadOnlyList<CheckInDto>>.Ok(checkIns.Select(ToCheckInDto).ToList());
    }

    public async Task<Result<IReadOnlyList<CheckInDto>>> ImportAsync(
        Guid userId,
        Guid experimentId,
        Stream csvStream,
        CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, experimentId, ct);
        if (experiment is null)
        {
            return Result<IReadOnlyList<CheckInDto>>.Fail(
                Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Status is not (ExperimentStatus.Active or ExperimentStatus.Draft))
        {
            return Result<IReadOnlyList<CheckInDto>>.Fail(
                Error.Conflict("Experiment.InvalidStatus", "Import is only allowed for draft or active experiments."));
        }

        IReadOnlyList<ImportedCheckInRow> rows;
        try
        {
            rows = csvImportParser.Parse(csvStream);
        }
        catch (Exception ex)
        {
            return Result<IReadOnlyList<CheckInDto>>.Fail(
                Error.Validation("Import.InvalidCsv", ex.Message));
        }

        if (rows.Count == 0)
        {
            return Result<IReadOnlyList<CheckInDto>>.Fail(
                Error.Validation("Import.Empty", "CSV contained no check-in rows."));
        }

        if (experiment.Status == ExperimentStatus.Draft)
        {
            var days = experiment.Template?.DaysPerPhase ?? 7;
            var start = rows.Min(r => r.Day);
            experiment.Status = ExperimentStatus.Active;
            experiment.StartDate = start;
            experiment.PhaseAEnd = start.AddDays(days - 1);
            experiment.EndDate = start.AddDays(days * 2 - 1);
        }

        var existingDays = experiment.CheckIns.Select(c => c.Day).ToHashSet();
        var imported = new List<CheckIn>();

        foreach (var row in rows)
        {
            if (!existingDays.Add(row.Day))
            {
                continue;
            }

            var checkIn = new CheckIn
            {
                Id = Guid.NewGuid(),
                ExperimentId = experiment.Id,
                Day = row.Day,
                Phase = row.Phase,
                MetricValue = row.MetricValue,
                Adhered = row.Adhered,
                Notes = row.Notes,
                SafetyFlag = row.SafetyFlag,
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.CheckIns.Add(checkIn);
            imported.Add(checkIn);

            if (row.SafetyFlag)
            {
                experiment.Status = ExperimentStatus.Stopped;
                experiment.StopReason =
                    "Safety stop: seek professional care if you feel unwell. N-of-1 Lab does not diagnose or treat medical conditions.";
            }
        }

        await db.SaveChangesAsync(ct);
        return Result<IReadOnlyList<CheckInDto>>.Ok(imported.Select(ToCheckInDto).ToList());
    }

    public async Task<Result<ExperimentResultDto>> CompleteAsync(Guid userId, Guid experimentId, CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, experimentId, ct);
        if (experiment is null)
        {
            return Result<ExperimentResultDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        // Active or Stopped (user stop / safety) may finalize a verdict; Draft cannot.
        // Completed: return existing result when present, otherwise conflict.
        if (experiment.Status == ExperimentStatus.Completed)
        {
            if (experiment.Result is not null)
            {
                return Result<ExperimentResultDto>.Ok(ToResultDto(experiment.Result));
            }

            return Result<ExperimentResultDto>.Fail(
                Error.Conflict(
                    "Experiment.InvalidStatus",
                    "Experiment is already completed but has no result."));
        }

        if (experiment.Status is not (ExperimentStatus.Active or ExperimentStatus.Stopped))
        {
            return Result<ExperimentResultDto>.Fail(
                Error.Conflict(
                    "Experiment.InvalidStatus",
                    "Only active or stopped experiments can be completed."));
        }

        if (experiment.Result is not null)
        {
            return Result<ExperimentResultDto>.Ok(ToResultDto(experiment.Result));
        }

        var analysis = ExperimentAnalyzer.Analyze(new AnalysisInput(
            experiment.CheckIns.Select(c => new AnalysisCheckIn(c.Day, c.Phase, c.MetricValue, c.Adhered, c.SafetyFlag)).ToList(),
            experiment.Template?.HigherIsBetter ?? true));

        if (analysis.IsFailure)
        {
            return Result<ExperimentResultDto>.Fail(analysis.Errors);
        }

        var output = analysis.Value;
        var result = new ExperimentResult
        {
            Id = Guid.NewGuid(),
            ExperimentId = experiment.Id,
            MeanA = output.MeanA,
            MeanB = output.MeanB,
            Delta = output.Delta,
            EffectSize = output.EffectSize,
            AdherenceA = output.AdherenceA,
            AdherenceB = output.AdherenceB,
            SampleSizeA = output.SampleSizeA,
            SampleSizeB = output.SampleSizeB,
            Verdict = output.Verdict,
            EvidenceJson = output.EvidenceJson,
            CreatedAt = DateTimeOffset.UtcNow
        };

        experiment.Status = ExperimentStatus.Completed;
        db.ExperimentResults.Add(result);
        await db.SaveChangesAsync(ct);

        return Result<ExperimentResultDto>.Ok(ToResultDto(result));
    }

    public async Task<Result<ExperimentResultDto>> GetResultAsync(Guid userId, Guid experimentId, CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, experimentId, ct);
        if (experiment is null)
        {
            return Result<ExperimentResultDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Result is null)
        {
            return Result<ExperimentResultDto>.Fail(Error.NotFound("Result.NotFound", "Experiment has no result yet."));
        }

        return Result<ExperimentResultDto>.Ok(ToResultDto(experiment.Result));
    }

    public async Task<Result<AnalysisPreviewDto>> PreviewAnalysisAsync(
        Guid userId,
        Guid experimentId,
        CancellationToken ct = default)
    {
        var experiment = await LoadOwnedAsync(userId, experimentId, ct);
        if (experiment is null)
        {
            return Result<AnalysisPreviewDto>.Fail(
                Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Status == ExperimentStatus.Completed)
        {
            return Result<AnalysisPreviewDto>.Fail(
                Error.Conflict(
                    "Experiment.UseResult",
                    "Experiment is completed; use GET /api/experiments/{id}/result instead of preview."));
        }

        if (experiment.Status is not (ExperimentStatus.Active or ExperimentStatus.Stopped))
        {
            return Result<AnalysisPreviewDto>.Fail(
                Error.Conflict(
                    "Experiment.InvalidStatus",
                    "Preview is only available for active or stopped experiments."));
        }

        var analysis = ExperimentAnalyzer.Analyze(new AnalysisInput(
            experiment.CheckIns.Select(c => new AnalysisCheckIn(c.Day, c.Phase, c.MetricValue, c.Adhered, c.SafetyFlag)).ToList(),
            experiment.Template?.HigherIsBetter ?? true));

        if (analysis.IsFailure)
        {
            return Result<AnalysisPreviewDto>.Fail(analysis.Errors);
        }

        var output = analysis.Value;
        return Result<AnalysisPreviewDto>.Ok(new AnalysisPreviewDto(
            output.MeanA,
            output.MeanB,
            output.Delta,
            output.EffectSize,
            output.AdherenceA,
            output.AdherenceB,
            output.SampleSizeA,
            output.SampleSizeB,
            output.Verdict,
            IsProvisional: true,
            output.EvidenceJson));
    }

    private async Task<Experiment?> LoadOwnedAsync(Guid userId, Guid id, CancellationToken ct) =>
        await db.Experiments
            .Include(e => e.Template)
            .Include(e => e.CheckIns)
            .Include(e => e.Result)
            .SingleOrDefaultAsync(e => e.Id == id && e.UserId == userId, ct);

    private static ExperimentDto ToDto(
        Experiment e,
        string? templateTitle,
        int checkInCount,
        ExperimentResultDto? result) =>
        new(e.Id, e.TemplateKey, templateTitle, e.Hypothesis, e.Status, e.StartDate, e.PhaseAEnd, e.EndDate,
            e.StopReason, checkInCount, result);

    private static CheckInDto ToCheckInDto(CheckIn c) =>
        new(c.Id, c.Day, c.Phase, c.MetricValue, c.Adhered, c.Notes, c.SafetyFlag);

    private static ExperimentResultDto ToResultDto(ExperimentResult r) =>
        new(r.ExperimentId, r.MeanA, r.MeanB, r.Delta, r.EffectSize, r.AdherenceA, r.AdherenceB,
            r.SampleSizeA, r.SampleSizeB, r.Verdict, r.EvidenceJson);
}
