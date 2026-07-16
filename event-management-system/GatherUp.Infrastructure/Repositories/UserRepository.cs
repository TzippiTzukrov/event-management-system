using GatherUp.Core.Enums;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.Infrastructure.Repositories;

public class UserRepository : XmlRepository<AppUser>, IUserRepository
{
    public UserRepository(string filePath) : base(filePath)
    {
        if (!GetAll().Any())
        {
            Add(new AppUser { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Username = "admin",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),   Role = UserRole.Admin });
            Add(new AppUser { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Username = "manager", PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123"), Role = UserRole.Manager });
        }
    }

    public AppUser? GetByUsername(string username)
        => GetAll().FirstOrDefault(u => u.Username == username);
}
