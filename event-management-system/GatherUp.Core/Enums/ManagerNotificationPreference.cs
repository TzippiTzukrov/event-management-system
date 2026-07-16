namespace GatherUp.Core.Enums;

[Flags]
public enum ManagerNotificationPreference
{
    None           = 0,
    RsvpReceived   = 1,  // אישור הגעה מהמשתתף
    PaymentReceived = 2, // תשלום בוצע
    VoteSubmitted  = 4,  // הצבעה בסקר
}
