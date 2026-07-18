namespace GatherUp.Core.Enums;

[Flags]
public enum NotificationPreference
{
    None         = 0,
    EventChanges = 1,
    NewPolls     = 4,
}
