using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Application.Abstractions;

public interface IJwtTokenService
{
    string CreateToken(User user);
}
