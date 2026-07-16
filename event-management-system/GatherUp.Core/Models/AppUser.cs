using GatherUp.Core.Enums;
using GatherUp.Core.Interfaces;

namespace GatherUp.Core.Models;

public class AppUser : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public required UserRole Role { get; set; }
    public string Email { get; set; } = string.Empty;
}
