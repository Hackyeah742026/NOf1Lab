namespace NOf1Lab.Api.Endpoints;

public static class TemplateEndpoints
{
    public static IEndpointRouteBuilder MapTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/templates").WithTags("Templates");

        group.MapGet("/", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("ListTemplates");

        return app;
    }
}
