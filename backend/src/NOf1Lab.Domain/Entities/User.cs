namespace NOf1Lab.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
    public DateTimeOffset CreatedAt { get; set; }

    public List<Experiment> Experiments { get; set; } = [];
}
