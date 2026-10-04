using Microsoft.Extensions.DependencyInjection;

namespace NOf1Lab.Infrastructure.DependencyInjection;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // EF Core, JWT, Gemini, CSV import, and other adapters will be registered here.
        return services;
    }
}
