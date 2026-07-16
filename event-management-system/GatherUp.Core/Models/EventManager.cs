using GatherUp.Core.Enums;

namespace GatherUp.Core.Models;

/// <summary>
/// מנהל האירוע — בעל הרשאות להוספת משתתפים, הפצת הודעות ופתיחת סקרים.
/// </summary>
public class EventManager : Person
{
    /// <summary>
    /// מזהה ה-AppUser המקושר — מאפשר לאמת את זהות המשתמש המחובר.
    /// </summary>
    public Guid? AppUserId { get; set; }

    /// <summary>
    /// על אילו פעולות המנהל מעוניין לקבל התראה במייל.
    /// </summary>
    public ManagerNotificationPreference NotificationPreferences { get; set; } = ManagerNotificationPreference.None;
}
