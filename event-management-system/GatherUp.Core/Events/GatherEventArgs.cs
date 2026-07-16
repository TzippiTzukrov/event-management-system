namespace GatherUp.Core.Events;

public class RsvpEventArgs(Guid eventId, Guid participantId, string participantName, bool isAttending) : EventArgs
{
    public Guid EventId         { get; } = eventId;
    public Guid ParticipantId   { get; } = participantId;
    public string ParticipantName { get; } = participantName;
    public bool IsAttending     { get; } = isAttending;
}

public class PaymentEventArgs(Guid eventId, Guid participantId, string participantName, decimal amount) : EventArgs
{
    public Guid EventId         { get; } = eventId;
    public Guid ParticipantId   { get; } = participantId;
    public string ParticipantName { get; } = participantName;
    public decimal Amount       { get; } = amount;
}

public class VoteEventArgs(Guid eventId, Guid pollId, string pollTitle, Guid participantId, string participantName, string answer) : EventArgs
{
    public Guid EventId           { get; } = eventId;
    public Guid PollId            { get; } = pollId;
    public string PollTitle       { get; } = pollTitle;
    public Guid ParticipantId     { get; } = participantId;
    public string ParticipantName { get; } = participantName;
    public string Answer          { get; } = answer;
}

public class PollCreatedEventArgs(Guid eventId, string eventTitle, string pollTitle) : EventArgs
{
    public Guid EventId     { get; } = eventId;
    public string EventTitle { get; } = eventTitle;
    public string PollTitle { get; } = pollTitle;
}

public class EventUpdatedEventArgs(Guid eventId, string eventTitle) : EventArgs
{
    public Guid EventId      { get; } = eventId;
    public string EventTitle { get; } = eventTitle;
}
