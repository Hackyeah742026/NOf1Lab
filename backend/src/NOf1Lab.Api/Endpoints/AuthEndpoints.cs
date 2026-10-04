namespace NOf1Lab.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("Register");

        group.MapPost("/login", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("Login");

        group.MapGet("/me", () => Results.StatusCode(StatusCodes.Status501NotImplemented))
            .WithName("Me");

        return app;
    }
}
