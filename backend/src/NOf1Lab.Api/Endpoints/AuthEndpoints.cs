using NOf1Lab.Api.Extensions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Application.Services;

namespace NOf1Lab.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest request, AuthService auth, CancellationToken ct) =>
        {
            var result = await auth.RegisterAsync(request, ct);
            return result.ToCreatedResult("/api/auth/me");
        }).AllowAnonymous().WithName("Register");

        group.MapPost("/login", async (LoginRequest request, AuthService auth, CancellationToken ct) =>
        {
            var result = await auth.LoginAsync(request, ct);
            return result.ToHttpResult();
        }).AllowAnonymous().WithName("Login");

        group.MapGet("/me", async (HttpContext http, AuthService auth, CancellationToken ct) =>
        {
            var result = await auth.GetMeAsync(http.User.GetUserId(), ct);
            return result.ToHttpResult();
        }).RequireAuthorization().WithName("Me");

        return app;
    }
}
