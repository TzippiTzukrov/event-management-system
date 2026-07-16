using GatherUp.Core.Events;
using GatherUp.Core.Interfaces;

namespace GatherUp.BL.Services;

/// <summary>
/// מחזיק את כל ה-events של המערכת ומאפשר לכל Service להפעיל אותם.
/// נרשם כ-Singleton כדי שכל ה-Services יחלקו את אותה מופע.
/// </summary>
public class EventNotifier : IEventNotifier
{
    public event EventHandler<RsvpEventArgs>?    OnRsvpReceived;
    public event EventHandler<PaymentEventArgs>? OnPaymentReceived;
    public event EventHandler<VoteEventArgs>?    OnVoteSubmitted;
    public event EventHandler<PollCreatedEventArgs>?  OnPollCreated;
    public event EventHandler<EventUpdatedEventArgs>? OnEventUpdated;

    public void RaiseRsvp(RsvpEventArgs args)               => OnRsvpReceived?.Invoke(this, args);
    public void RaisePayment(PaymentEventArgs args)         => OnPaymentReceived?.Invoke(this, args);
    public void RaiseVote(VoteEventArgs args)               => OnVoteSubmitted?.Invoke(this, args);
    public void RaisePollCreated(PollCreatedEventArgs args) => OnPollCreated?.Invoke(this, args);
    public void RaiseEventUpdated(EventUpdatedEventArgs args) => OnEventUpdated?.Invoke(this, args);
}
