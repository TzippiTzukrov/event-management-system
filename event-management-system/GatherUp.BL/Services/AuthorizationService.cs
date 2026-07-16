using GatherUp.Core.Enums;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.BL.Services;

/// <summary>
/// מרכז את כל לוגיקת ההרשאות — מי מורשה לבצע מה על אירוע נתון.
/// </summary>
public class AuthorizationService(IRepository<GatherEvent> eventRepo)
{
    /// <summary>
    /// בודק אם המשתמש הוא מנהל של האירוע הנתון.
    /// </summary>
    public bool IsManagerOfEvent(Guid userId, Guid eventId)
    {
        var ev = eventRepo.GetById(eventId);
        return ev?.Managers.Any(m => m.AppUserId == userId) ?? false;
    }

    /// <summary>
    /// בודק אם המשתמש הוא משתתף של האירוע הנתון — לפי AppUserId או username (email).
    /// </summary>
    public bool IsParticipantOfEvent(Guid userId, Guid eventId, string? username = null)
    {
        var ev = eventRepo.GetById(eventId);
        if (ev is null) return false;
        return ev.Participants.Any(p =>
            (p.AppUserId.HasValue && p.AppUserId == userId) ||
            (!string.IsNullOrWhiteSpace(username) &&
             p.Email.Equals(username, StringComparison.OrdinalIgnoreCase)));
    }

    /// <summary>
    /// מנהל האירוע או Admin מערכת — מורשים לפעולות ניהוליות.
    /// </summary>
    public bool IsManagerOrAdmin(Guid userId, UserRole role, Guid eventId)
        => role == UserRole.Admin || IsManagerOfEvent(userId, eventId);

    /// <summary>
    /// רק Admin מערכת.
    /// </summary>
    public static bool IsAdmin(UserRole role) => role == UserRole.Admin;
}
