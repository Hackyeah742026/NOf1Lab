using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Contracts;
using NOf1Lab.Domain.Common;
using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Application.Services;

public sealed class AuthService(
    IAppDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService)
{
    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return Result<AuthResponse>.Fail(Error.Validation("Auth.InvalidInput", "Email and password are required."));
        }

        if (request.Password.Length < 6)
        {
            return Result<AuthResponse>.Fail(Error.Validation("Auth.WeakPassword", "Password must be at least 6 characters."));
        }

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
        {
            return Result<AuthResponse>.Fail(Error.Conflict("Auth.EmailTaken", "An account with this email already exists."));
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            Language = string.IsNullOrWhiteSpace(request.Language) ? "en" : request.Language.Trim().ToLowerInvariant(),
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        return Result<AuthResponse>.Ok(ToAuthResponse(user));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var email = NormalizeEmail(request.Email);
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Result<AuthResponse>.Fail(Error.Validation("Auth.InvalidCredentials", "Invalid email or password."));
        }

        return Result<AuthResponse>.Ok(ToAuthResponse(user));
    }

    public async Task<Result<UserDto>> GetMeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
        {
            return Result<UserDto>.Fail(Error.NotFound("Auth.UserNotFound", "User was not found."));
        }

        return Result<UserDto>.Ok(new UserDto(user.Id, user.Email, user.Language));
    }

    private AuthResponse ToAuthResponse(User user) =>
        new(jwtTokenService.CreateToken(user), new UserDto(user.Id, user.Email, user.Language));

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
