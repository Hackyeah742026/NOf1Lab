using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Domain.Common;

namespace NOf1Lab.Application.Services;

public sealed class ExplainService(IAppDbContext db, IAiExplainer aiExplainer)
{
    public async Task<Result<ExplainDto>> ExplainAsync(Guid userId, Guid experimentId, CancellationToken ct = default)
    {
        var experiment = await db.Experiments.AsNoTracking()
            .Include(e => e.Template)
            .Include(e => e.Result)
            .Include(e => e.User)
            .SingleOrDefaultAsync(e => e.Id == experimentId && e.UserId == userId, ct);

        if (experiment is null)
        {
            return Result<ExplainDto>.Fail(Error.NotFound("Experiment.NotFound", "Experiment was not found."));
        }

        if (experiment.Result is null)
        {
            return Result<ExplainDto>.Fail(Error.Conflict("Result.Missing", "Complete the experiment before asking for an explanation."));
        }

        var result = experiment.Result;
        var response = await aiExplainer.ExplainAsync(new ExplainRequest(
            TemplateTitle: experiment.Template?.Title ?? experiment.TemplateKey,
            Hypothesis: experiment.Hypothesis,
            Verdict: result.Verdict.ToString(),
            MeanA: result.MeanA,
            MeanB: result.MeanB,
            Delta: result.Delta,
            EffectSize: result.EffectSize,
            AdherenceA: result.AdherenceA,
            AdherenceB: result.AdherenceB,
            SampleSizeA: result.SampleSizeA,
            SampleSizeB: result.SampleSizeB,
            Language: experiment.User?.Language ?? "en"), ct);

        var validated = ValidateNumbers(response.Explanation, result.MeanA, result.MeanB, result.Delta, result.EffectSize);
        if (!validated)
        {
            var fallback = BuildFallback(experiment.Template?.Title ?? experiment.TemplateKey, result.Verdict.ToString(),
                result.MeanA, result.MeanB, result.Delta, result.EffectSize, result.AdherenceA, result.AdherenceB);
            return Result<ExplainDto>.Ok(new ExplainDto(
                fallback,
                SuggestNext(experiment.TemplateKey),
                ["meanA", "meanB", "delta", "effectSize", "adherence"],
                UsedFallback: true));
        }

        return Result<ExplainDto>.Ok(new ExplainDto(
            response.Explanation,
            response.SuggestedNextTemplateKey ?? SuggestNext(experiment.TemplateKey),
            response.EvidenceKeys,
            response.UsedFallback));
    }

    public static bool ValidateNumbers(string text, params decimal[] figures)
    {
        // Reject explanations that invent extra decimal figures not present in the computed set.
        var matches = System.Text.RegularExpressions.Regex.Matches(text, @"-?\d+\.\d{1,3}");
        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            if (!decimal.TryParse(match.Value, System.Globalization.NumberStyles.Number,
                    System.Globalization.CultureInfo.InvariantCulture, out var value))
            {
                continue;
            }

            if (!figures.Any(f => Math.Abs(f - value) < 0.001m))
            {
                return false;
            }
        }

        return true;
    }

    private static string BuildFallback(
        string title,
        string verdict,
        decimal meanA,
        decimal meanB,
        decimal delta,
        decimal effectSize,
        decimal adherenceA,
        decimal adherenceB) =>
        $"For “{title}”, the computed verdict is {verdict}. " +
        $"Phase A mean was {meanA} and phase B mean was {meanB} (delta {delta}, effect size {effectSize}). " +
        $"Adherence was {adherenceA}% in A and {adherenceB}% in B. " +
        "This is coaching/self-experimentation support only — not medical advice.";

    private static string SuggestNext(string currentKey) => currentKey switch
    {
        "earlier-bedtime" => "caffeine-cutoff",
        "caffeine-cutoff" => "evening-walk",
        "evening-walk" => "morning-light",
        "morning-light" => "phone-free-first-hour",
        "phone-free-first-hour" => "protein-breakfast",
        "protein-breakfast" => "hydration-2l",
        "hydration-2l" => "midday-stretch",
        "midday-stretch" => "training-load",
        "training-load" => "strength-2x",
        "strength-2x" => "no-delivery-dinners",
        "no-delivery-dinners" => "earlier-bedtime",
        _ => "earlier-bedtime"
    };
}
