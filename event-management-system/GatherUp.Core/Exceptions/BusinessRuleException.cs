namespace GatherUp.Core.Exceptions;

/// <summary>
/// נזרק כאשר פעולה מפרה כלל עסקי (סקר סגור, כפילות אימייל, קבלה נעולה וכו').
/// ממופה ל-400 Bad Request.
/// </summary>
public class BusinessRuleException(string message) : Exception(message);
