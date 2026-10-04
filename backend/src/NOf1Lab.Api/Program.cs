using System.Text.Json.Serialization;
using NOf1Lab.Api.Endpoints;
using NOf1Lab.Application.DependencyInjection;
using NOf1Lab.Infrastructure.DependencyInjection;
using NOf1Lab.Infrastructure.Persistence;
using Scalar.AspNetCore;

var rootEnv = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", ".env"));
if (!File.Exists(rootEnv))
{
    rootEnv = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
}
if (File.Exists(rootEnv))
{
    DotNetEnv.Env.Load(rootEnv);
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddOpenApi();

// Compose uses Cors:Origins; Render/hosted uses Cors:AllowedOrigins (supports https://*.vercel.app).
var defaultCorsOrigins = new[]
{
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
};
var allowedOrigins = new[]
    {
        builder.Configuration["Cors:AllowedOrigins"],
        builder.Configuration["Cors:Origins"]
    }
    .Where(static s => !string.IsNullOrWhiteSpace(s))
    .SelectMany(static s => s!.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    .Select(static origin => origin.TrimEnd('/'))
    .Concat(defaultCorsOrigins)
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigins)
            .SetIsOriginAllowedToAllowWildcardSubdomains()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

await DbSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (ShouldUseHttpsRedirection())
{
    app.UseHttpsRedirection();
}

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapTemplateEndpoints();
app.MapExperimentEndpoints();
app.MapDemoEndpoints();

app.Run();

static bool ShouldUseHttpsRedirection()
{
    if (string.Equals(
            Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECTION"),
            "true",
            StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
    if (string.IsNullOrWhiteSpace(urls))
    {
        return true;
    }

    var bindings = urls.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    var httpOnly = bindings.Length > 0
        && bindings.All(u => u.StartsWith("http://", StringComparison.OrdinalIgnoreCase));

    return !httpOnly;
}

public partial class Program;
