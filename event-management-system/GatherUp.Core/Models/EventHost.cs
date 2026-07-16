namespace GatherUp.Core.Models;

/// <summary>
/// בעל האירוע — האדם שעבורו מופק המפגש.
/// אינו מעורב בניהול, בבחירות או בגביית תשלום.
/// </summary>
public class EventHost : Person
{
    /// <summary>
    /// מזהה ה-AppUser המקושר — מאפשר לאמת את זהות המשתמש המחובר.
    /// </summary>
    public Guid? AppUserId { get; set; }
}
