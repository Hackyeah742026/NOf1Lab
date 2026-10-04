using NOf1Lab.Api.Extensions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Application.Services;

namespace NOf1Lab.Api.Endpoints;

public static class ExperimentEndpoints
{
    public static IEndpointRouteBuilder MapExperimentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/experiments").WithTags("Experiments").RequireAuthorization();

        group.MapPost("/", async (CreateExperimentRequest request, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.CreateAsync(http.User.GetUserId(), request, ct);
            return result.IsSuccess
                ? Results.Created($"/api/experiments/{result.Value.Id}", result.Value)
                : result.ToHttpResult();
        }).WithName("CreateExperiment");

        group.MapGet("/", async (HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.ListAsync(http.User.GetUserId(), ct);
            return result.ToHttpResult();
        }).WithName("ListExperiments");

        group.MapGet("/{id:guid}", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.GetAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("GetExperiment");

        group.MapPost("/{id:guid}/start", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.StartAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("StartExperiment");

        group.MapPost("/{id:guid}/stop", async (Guid id, StopRequest? body, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.StopAsync(http.User.GetUserId(), id, body?.Reason, ct);
            return result.ToHttpResult();
        }).WithName("StopExperiment");

        group.MapPost("/{id:guid}/check-ins", async (Guid id, CreateCheckInRequest request, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.AddCheckInAsync(http.User.GetUserId(), id, request, ct);
            return result.ToCreatedResult($"/api/experiments/{id}/check-ins");
        }).WithName("CreateCheckIn");

        group.MapGet("/{id:guid}/check-ins", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.ListCheckInsAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("ListCheckIns");

        group.MapPost("/{id:guid}/import", async (Guid id, HttpRequest request, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            if (!request.HasFormContentType)
            {
                return Results.BadRequest(new { title = "Import.InvalidContent", detail = "Expected multipart form with file." });
            }

            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
            if (file is null || file.Length == 0)
            {
                return Results.BadRequest(new { title = "Import.MissingFile", detail = "Upload a CSV file under 'file'." });
            }

            await using var stream = file.OpenReadStream();
            var result = await experiments.ImportAsync(http.User.GetUserId(), id, stream, ct);
            return result.ToHttpResult();
        }).DisableAntiforgery().WithName("ImportCheckIns");

        group.MapPost("/{id:guid}/complete", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.CompleteAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("CompleteExperiment");

        group.MapGet("/{id:guid}/analysis/preview", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.PreviewAnalysisAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("PreviewAnalysis");

        group.MapGet("/{id:guid}/result", async (Guid id, HttpContext http, ExperimentService experiments, CancellationToken ct) =>
        {
            var result = await experiments.GetResultAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("GetExperimentResult");

        group.MapPost("/{id:guid}/explain", async (Guid id, HttpContext http, ExplainService explain, CancellationToken ct) =>
        {
            var result = await explain.ExplainAsync(http.User.GetUserId(), id, ct);
            return result.ToHttpResult();
        }).WithName("ExplainExperiment");

        return app;
    }

    private sealed record StopRequest(string? Reason);
}
