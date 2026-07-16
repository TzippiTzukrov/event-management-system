using GatherUp.Core.Events;

namespace GatherUp.Core.Interfaces;

/// <summary>
/// ממשק המגדיר את כל ה-events שניתן להירשם אליהם במערכת.
/// ה-Services מפעילים את ה-events, ו-NotificationService נרשם אליהם.
/// </summary>
public interface IEventNotifier
{
    // ── Events שמנהל יכול להירשם אליהם ────────────────────────────────────
    event EventHandler<RsvpEventArgs>    OnRsvpReceived;
    event EventHandler<PaymentEventArgs> OnPaymentReceived;
    event EventHandler<VoteEventArgs>    OnVoteSubmitted;

    // ── Events שמשתתף יכול להירשם אליהם ───────────────────────────────────
    event EventHandler<PollCreatedEventArgs>  OnPollCreated;
    event EventHandler<EventUpdatedEventArgs> OnEventUpdated;

    // ── Raise methods — להפעלת ה-events מתוך ה-Services ───────────────────
    void RaiseRsvp(RsvpEventArgs args);
    void RaisePayment(PaymentEventArgs args);
    void RaiseVote(VoteEventArgs args);
    void RaisePollCreated(PollCreatedEventArgs args);
    void RaiseEventUpdated(EventUpdatedEventArgs args);
}
