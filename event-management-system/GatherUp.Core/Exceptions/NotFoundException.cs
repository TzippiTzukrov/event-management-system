namespace GatherUp.Core.Exceptions;

/// <summary>
/// נזרק כאשר רשומה מבוקשת לא קיימת במערכת (אירוע, משתתף, ספק וכו').
/// ממופה ל-404 Not Found.
/// </summary>
public class NotFoundException(string message) : Exception(message);
