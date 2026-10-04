namespace NOf1Lab.Application.Contracts;

public sealed record RegisterRequest(string Email, string Password, string? Language);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, UserDto User);
public sealed record UserDto(Guid Id, string Email, string Language);
