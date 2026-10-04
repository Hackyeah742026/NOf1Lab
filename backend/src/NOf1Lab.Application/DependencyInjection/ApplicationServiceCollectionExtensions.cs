using Microsoft.Extensions.DependencyInjection;
using NOf1Lab.Application.Services;

namespace NOf1Lab.Application.DependencyInjection;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<TemplateService>();
        services.AddScoped<ExperimentService>();
        services.AddScoped<ExplainService>();
        services.AddScoped<DemoService>();
        return services;
    }
}
