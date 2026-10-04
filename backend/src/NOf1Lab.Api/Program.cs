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
// Extra origins for hosted front ends, e.g. Cors__AllowedOrigins="https://nof1lab.vercel.app,https://*.vercel.app".
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"] ?? string.Empty)
    .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(origin => origin.TrimEnd('/'))
    .Concat(["http://localhost:5173", "http://127.0.0.1:5173"])
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
app.UseHttpsRedirection();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapTemplateEndpoints();
app.MapExperimentEndpoints();
app.MapDemoEndpoints();

app.Run();

public partial class Program;
