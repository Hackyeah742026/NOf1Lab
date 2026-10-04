using NOf1Lab.Api.Endpoints;
using NOf1Lab.Application.DependencyInjection;
using NOf1Lab.Infrastructure.DependencyInjection;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();
app.UseHttpsRedirection();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapTemplateEndpoints();
app.MapExperimentEndpoints();

app.Run();

public partial class Program;
