namespace NOf1Lab.Api.Endpoints;

public static class ExperimentEndpoints
{
    public static IEndpointRouteBuilder MapExperimentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/experiments").WithTags("Experiments");

        group.MapPost("/", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("CreateExperiment");

        group.MapGet("/", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("ListExperiments");

        group.MapGet("/{id:guid}", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("GetExperiment");

        group.MapPost("/{id:guid}/start", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("StartExperiment");

        group.MapPost("/{id:guid}/stop", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("StopExperiment");

        group.MapPost("/{id:guid}/check-ins", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("CreateCheckIn");

        group.MapGet("/{id:guid}/check-ins", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("ListCheckIns");

        group.MapPost("/{id:guid}/import", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("ImportCheckIns");

        group.MapPost("/{id:guid}/complete", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("CompleteExperiment");

        group.MapGet("/{id:guid}/result", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("GetExperimentResult");

        group.MapPost("/{id:guid}/explain", (Guid id) => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("ExplainExperiment");

        return app;
    }
}
