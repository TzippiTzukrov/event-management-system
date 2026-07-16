namespace GatherUp.Core.Exceptions;

/// <summary>
/// נזרק כאשר נתוני קלט אינם תקינים (שדה חובה חסר, ערך שלילי וכו').
/// ממופה ל-400 Bad Request.
/// </summary>
public class ValidationException(string message) : Exception(message);
