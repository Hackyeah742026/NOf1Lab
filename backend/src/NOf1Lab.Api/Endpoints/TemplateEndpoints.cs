using NOf1Lab.Api.Extensions;
using NOf1Lab.Application.Services;

namespace NOf1Lab.Api.Endpoints;

public static class TemplateEndpoints
{
    public static IEndpointRouteBuilder MapTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/templates").WithTags("Templates").RequireAuthorization();

        group.MapGet("/", async (TemplateService templates, CancellationToken ct) =>
        {
            var result = await templates.ListAsync(ct);
            return result.ToHttpResult();
        }).WithName("ListTemplates");

        group.MapGet("/{key}", async (string key, TemplateService templates, CancellationToken ct) =>
        {
            var result = await templates.GetAsync(key, ct);
            return result.ToHttpResult();
        }).WithName("GetTemplate");

        return app;
    }
}
