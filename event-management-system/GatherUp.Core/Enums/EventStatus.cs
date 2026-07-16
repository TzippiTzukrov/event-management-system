namespace GatherUp.Core.Enums;

public enum EventStatus
{
    Draft,           // נוצר, טרם נשלחו הזמנות
    PollOpen,        // שאלון מקדים פתוח
    PollClosed,      // שאלון נסגר, ממתין להחלטת מנהל
    InvitationsSent, // הזמנות נשלחו
    Active,          // האירוע פעיל
    Completed,       // האירוע הסתיים
    Cancelled
}
