using GatherUp.Core.Enums;
using GatherUp.Core.Events;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.BL.Services;

public class NotificationService(
    IEmailService emailService,
    IRepository<GatherEvent> eventRepo,
    IEventNotifier notifier)
{
    /// <summary>
    /// רישום לכל ה-events — נקרא פעם אחת ב-startup.
    /// </summary>
    public void RegisterToEvents()
    {
        notifier.OnRsvpReceived    += HandleRsvp;
        notifier.OnPaymentReceived += HandlePayment;
        notifier.OnVoteSubmitted   += HandleVote;
        notifier.OnPollCreated     += HandlePollCreated;
        notifier.OnEventUpdated    += HandleEventUpdated;
    }

    // ── Handlers ────────────────────────────────────────────────────────────

    /// <summary>
    /// אישור הגעה — שולח למנהלים שביקשו לדעת.
    /// </summary>
    private void HandleRsvp(object? sender, RsvpEventArgs e)
    {
        var ev = eventRepo.GetById(e.EventId);
        if (ev is null) return;

        var recipients = ev.Managers
            .Where(m => m.NotificationPreferences.HasFlag(ManagerNotificationPreference.RsvpReceived)
                     && !string.IsNullOrWhiteSpace(m.Email))
            .Select(m => m.Email)
            .ToList();

        if (recipients.Count == 0) return;

        var status = e.IsAttending ? "אישר הגעה ✓" : "דחה הגעה ✗";
        emailService.SendBulk(recipients,
            $"עדכון הגעה — {ev.Title}",
            $"<div dir='rtl'><p>המשתתף <strong>{e.ParticipantName}</strong> {status} לאירוע <strong>{ev.Title}</strong>.</p></div>");
    }

    /// <summary>
    /// תשלום בוצע — שולח למנהלים שביקשו לדעת.
    /// </summary>
    private void HandlePayment(object? sender, PaymentEventArgs e)
    {
        var ev = eventRepo.GetById(e.EventId);
        if (ev is null) return;

        var recipients = ev.Managers
            .Where(m => m.NotificationPreferences.HasFlag(ManagerNotificationPreference.PaymentReceived)
                     && !string.IsNullOrWhiteSpace(m.Email))
            .Select(m => m.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients,
            $"תשלום התקבל — {ev.Title}",
            $"<div dir='rtl'><p>המשתתף <strong>{e.ParticipantName}</strong> שילם ₪{e.Amount} לאירוע <strong>{ev.Title}</strong>.</p></div>");
    }

    /// <summary>
    /// הצבעה בסקר — שולח למנהלים שביקשו לדעת.
    /// </summary>
    private void HandleVote(object? sender, VoteEventArgs e)
    {
        var ev = eventRepo.GetById(e.EventId);
        if (ev is null) return;

        var recipients = ev.Managers
            .Where(m => m.NotificationPreferences.HasFlag(ManagerNotificationPreference.VoteSubmitted)
                     && !string.IsNullOrWhiteSpace(m.Email))
            .Select(m => m.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients,
            $"הצבעה חדשה בסקר — {ev.Title}",
            $"<div dir='rtl'><p>המשתתף <strong>{e.ParticipantName}</strong> הצביע <strong>{e.Answer}</strong> בסקר <strong>{e.PollTitle}</strong>.</p></div>");
    }

    /// <summary>
    /// סקר חדש נוצר — שולח למשתתפים שביקשו לדעת.
    /// </summary>
    private void HandlePollCreated(object? sender, PollCreatedEventArgs e)
    {
        var ev = eventRepo.GetById(e.EventId);
        if (ev is null) return;

        var recipients = ev.Participants
            .Where(p => p.NotificationPreferences.HasFlag(NotificationPreference.NewPolls)
                     && !string.IsNullOrWhiteSpace(p.Email))
            .Select(p => p.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients,
            $"סקר חדש — {e.EventTitle}",
            $"<div dir='rtl'><p>נפתח סקר חדש: <strong>{e.PollTitle}</strong> באירוע <strong>{e.EventTitle}</strong>.</p></div>");
    }

    /// <summary>
    /// פרטי אירוע עודכנו — שולח למשתתפים שביקשו לדעת.
    /// </summary>
    private void HandleEventUpdated(object? sender, EventUpdatedEventArgs e)
    {
        var ev = eventRepo.GetById(e.EventId);
        if (ev is null) return;

        var recipients = ev.Participants
            .Where(p => p.NotificationPreferences.HasFlag(NotificationPreference.EventChanges)
                     && !string.IsNullOrWhiteSpace(p.Email))
            .Select(p => p.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients,
            $"עדכון פרטי אירוע — {e.EventTitle}",
            $"<div dir='rtl'><p>פרטי האירוע <strong>{e.EventTitle}</strong> עודכנו. היכנסו למערכת לפרטים.</p></div>");
    }

    // ── שליחות ישירות (אינן דרך events) ────────────────────────────────────

    public void SendInvitations(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        if (ev.Host is null)
            throw new BusinessRuleException("לא ניתן לשלוח הזמנות ללא בעל אירוע.");

        var recipients = ev.Participants
            .Where(p => !string.IsNullOrWhiteSpace(p.Email))
            .Select(p => p.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients, $"הזמנה: {ev.Title}", BuildInvitationBody(ev));

        ev.Status = EventStatus.InvitationsSent;
        eventRepo.Update(ev);
    }

    public void SendPaymentReminders(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        ev.Participants
            .Where(p => !p.HasPaid && p.IsAttending == true && !string.IsNullOrWhiteSpace(p.Email))
            .ToList()
            .ForEach(p => emailService.Send(p.Email,
                $"תזכורת תשלום — {ev.Title}",
                $"<div dir='rtl'><p>שלום {p.Name}, הסכום לתשלום: ₪{ev.PricePerParticipant}</p></div>"));
    }

    public void SendEventUpdate(Guid eventId, string updateMessage)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var recipients = ev.Participants
            .Where(p => !string.IsNullOrWhiteSpace(p.Email))
            .Select(p => p.Email)
            .ToList();

        if (recipients.Count == 0) return;

        emailService.SendBulk(recipients, $"עדכון: {ev.Title}", updateMessage);
    }

    public void SendWelcomeToParticipant(Guid eventId, Participant participant)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        if (string.IsNullOrWhiteSpace(participant.Email)) return;

        var body = $@"<div dir='rtl'>
<h2>שלום {participant.Name},</h2>
<p>נרשמת לאירוע <strong>{ev.Title}</strong>.</p>
{(ev.EventDate.HasValue ? $"<p>📅 תאריך: {ev.EventDate.Value.ToShortDateString()}</p>" : "")}
{(!string.IsNullOrWhiteSpace(ev.Location) ? $"<p>📍 מיקום: {ev.Location}</p>" : "")}
{(ev.PricePerParticipant.HasValue ? $"<p>💰 עלות: ₪{ev.PricePerParticipant}</p>" : "")}
</div>";

        emailService.Send(participant.Email, $"הוזמנת לאירוע: {ev.Title}", body);
    }

    private static string BuildInvitationBody(GatherEvent ev) =>
        string.Join("\n", new[]
        {
            $"הזמנה לאירוע: {ev.Title}",
            $"תאריך: {ev.EventDate?.ToShortDateString()}",
            $"מיקום: {ev.Location}",
            ev.CustomMessage ?? "",
            ev.PricePerParticipant.HasValue ? $"עלות: ₪{ev.PricePerParticipant}" : ""
        }.Where(s => !string.IsNullOrWhiteSpace(s)));
}
