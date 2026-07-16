using GatherUp.Core.Models;

namespace GatherUp.Core.Interfaces;

public interface IUserRepository : IRepository<AppUser>
{
    AppUser? GetByUsername(string username);
}
