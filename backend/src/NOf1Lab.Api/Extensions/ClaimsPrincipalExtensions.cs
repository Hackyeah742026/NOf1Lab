using System.Security.Claims;

namespace NOf1Lab.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        return Guid.TryParse(value, out var id)
            ? id
            : throw new UnauthorizedAccessException("Missing user id claim.");
    }
}
