using Microsoft.AspNetCore.Identity;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Infrastructure.Auth;

public sealed class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(string password) => _hasher.HashPassword(new User(), password);

    public bool Verify(string password, string passwordHash)
    {
        var result = _hasher.VerifyHashedPassword(new User(), passwordHash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
