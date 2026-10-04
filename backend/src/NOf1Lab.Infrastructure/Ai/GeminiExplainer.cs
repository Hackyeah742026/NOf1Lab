using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NOf1Lab.Application.Abstractions;

namespace NOf1Lab.Infrastructure.Ai;

public sealed class GeminiExplainer(
    HttpClient httpClient,
    IOptions<GeminiOptions> options,
    ILogger<GeminiExplainer> logger) : IAiExplainer
{
    public async Task<ExplainResponse> ExplainAsync(ExplainRequest request, CancellationToken ct = default)
    {
        var apiKey = options.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Fallback(request);
        }

        try
        {
            var promptTemplate = await ReadPromptAsync(ct);
            var input = BuildInput(request);
            var prompt = promptTemplate.Replace("{{INPUT}}", input, StringComparison.Ordinal);

            var model = options.Value.Model;
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";
            using var response = await httpClient.PostAsJsonAsync(url, new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            }, ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Gemini explain failed with status {StatusCode}", response.StatusCode);
                return Fallback(request);
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(text))
            {
                return Fallback(request);
            }

            var (explanation, next) = SplitNextTemplate(text);
            return new ExplainResponse(
                explanation.Trim(),
                next,
                ["meanA", "meanB", "delta", "effectSize", "adherence", "verdict"],
                UsedFallback: false);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Gemini explain threw; using fallback.");
            return Fallback(request);
        }
    }

    private static ExplainResponse Fallback(ExplainRequest request)
    {
        var explanation =
            $"For “{request.TemplateTitle}”, the computed verdict is {request.Verdict}. " +
            $"Phase A mean was {request.MeanA} and phase B mean was {request.MeanB} " +
            $"(delta {request.Delta}, effect size {request.EffectSize}). " +
            $"Adherence was {request.AdherenceA}% in A and {request.AdherenceB}% in B. " +
            "AI explanation is unavailable right now, so this summary uses only the calculated numbers. " +
            "This is coaching/self-experimentation support only — not medical advice.";

        return new ExplainResponse(
            explanation,
            null,
            ["meanA", "meanB", "delta", "effectSize", "adherence", "verdict"],
            UsedFallback: true);
    }

    private static string BuildInput(ExplainRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Language: {request.Language}");
        sb.AppendLine($"Template: {request.TemplateTitle}");
        sb.AppendLine($"Hypothesis: {request.Hypothesis}");
        sb.AppendLine($"Verdict: {request.Verdict}");
        sb.AppendLine($"MeanA: {request.MeanA}");
        sb.AppendLine($"MeanB: {request.MeanB}");
        sb.AppendLine($"Delta: {request.Delta}");
        sb.AppendLine($"EffectSize: {request.EffectSize}");
        sb.AppendLine($"AdherenceA: {request.AdherenceA}");
        sb.AppendLine($"AdherenceB: {request.AdherenceB}");
        sb.AppendLine($"SampleSizeA: {request.SampleSizeA}");
        sb.AppendLine($"SampleSizeB: {request.SampleSizeB}");
        return sb.ToString();
    }

    private static (string Explanation, string? Next) SplitNextTemplate(string text)
    {
        const string marker = "NEXT_TEMPLATE=";
        var idx = text.LastIndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0)
        {
            return (text, null);
        }

        var explanation = text[..idx].Trim();
        var next = text[(idx + marker.Length)..].Trim();
        if (string.Equals(next, "none", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(next))
        {
            return (explanation, null);
        }

        return (explanation, next);
    }

    private static async Task<string> ReadPromptAsync(CancellationToken ct)
    {
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Ai", "Prompts", "explain-result.md"),
            Path.Combine(AppContext.BaseDirectory, "NOf1Lab.Infrastructure", "Ai", "Prompts", "explain-result.md"),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..",
                "NOf1Lab.Infrastructure", "Ai", "Prompts", "explain-result.md"))
        };

        var path = candidates.FirstOrDefault(File.Exists)
            ?? throw new FileNotFoundException("Missing explain-result.md prompt file.");

        return await File.ReadAllTextAsync(path, ct);
    }
}
