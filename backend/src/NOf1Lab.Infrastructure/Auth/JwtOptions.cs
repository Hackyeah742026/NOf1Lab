namespace NOf1Lab.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "NOf1Lab";
    public string Audience { get; set; } = "NOf1Lab";
    public string Key { get; set; } = "DEV_ONLY_CHANGE_ME_NOf1Lab_Super_Secret_Key_123!";
    public int ExpiryMinutes { get; set; } = 60 * 24;
}
