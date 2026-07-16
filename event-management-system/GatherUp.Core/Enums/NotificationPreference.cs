namespace GatherUp.Core.Enums;

[Flags]
public enum NotificationPreference
{
    None = 0,
    EventChanges = 1,
    DirectMessages = 2,
    NewPolls = 4
}
