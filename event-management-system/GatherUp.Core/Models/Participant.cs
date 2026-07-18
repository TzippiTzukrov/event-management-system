using GatherUp.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace GatherUp.Core.Models;

public class Participant : Person
{
    /// <summary>
    /// מזהה ה-AppUser המקושר — מאפשר לאמת את זהות המשתמש המחובר.
    /// </summary>
    public Guid? AppUserId { get; set; }

    public bool? IsAttending { get; set; } = null;  // null = טרם השיב

    public bool HasPaid { get; set; } = false;

    [Range(0, double.MaxValue, ErrorMessage = "הסכום ששולם לא יכול להיות שלילי.")]
    public decimal AmountPaid { get; set; } = 0;

    public NotificationPreference NotificationPreferences { get; set; } =
        NotificationPreference.EventChanges | NotificationPreference.NewPolls;
}
