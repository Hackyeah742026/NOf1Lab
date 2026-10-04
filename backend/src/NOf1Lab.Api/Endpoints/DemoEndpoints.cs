using NOf1Lab.Api.Extensions;
using NOf1Lab.Application.Services;

namespace NOf1Lab.Api.Endpoints;

public static class DemoEndpoints
{
    public static IEndpointRouteBuilder MapDemoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/demo").WithTags("Demo").RequireAuthorization();

        group.MapGet("/showcase", async (HttpContext http, DemoService demo, CancellationToken ct) =>
        {
            var result = await demo.GetShowcaseAsync(http.User.GetUserId(), ct);
            return result.ToHttpResult();
        }).WithName("GetDemoShowcase");

        return app;
    }
}
