using Microsoft.Extensions.DependencyInjection;

namespace NOf1Lab.Application.DependencyInjection;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Use-case handlers and validators will be registered here.
        return services;
    }
}
