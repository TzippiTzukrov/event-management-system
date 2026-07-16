using GatherUp.Core.Enums;
using GatherUp.Core.Events;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.BL.Services;

public class ParticipantService(IRepository<GatherEvent> eventRepo, IEventNotifier notifier)
{
    public Participant AddParticipant(Guid eventId, Participant participant)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        if (string.IsNullOrWhiteSpace(participant.Name))
            throw new ValidationException("שם המשתתף הוא שדה חובה.");
        if (string.IsNullOrWhiteSpace(participant.Email))
            throw new ValidationException("אימייל המשתתף הוא שדה חובה.");

        if (ev.Participants.Any(p => p.Email == participant.Email))
            throw new BusinessRuleException($"משתתף עם האימייל '{participant.Email}' כבר קיים באירוע.");

        ev.Participants.Add(participant);
        eventRepo.Update(ev);
        return participant;
    }

    public IEnumerable<Participant> GetParticipants(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        return ev.Participants;
    }

    public void UpdateRsvp(Guid eventId, Guid participantId, bool isAttending)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var participant = ev.Participants.FirstOrDefault(p => p.Id == participantId)
            ?? throw new NotFoundException($"משתתף {participantId} לא נמצא.");

        participant.IsAttending = isAttending;
        eventRepo.Update(ev);

        notifier.RaiseRsvp(new RsvpEventArgs(eventId, participantId, participant.Name, isAttending));
    }

    public void UpdateNotifications(Guid eventId, Guid participantId, NotificationPreference prefs)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var participant = ev.Participants.FirstOrDefault(p => p.Id == participantId)
            ?? throw new NotFoundException($"משתתף {participantId} לא נמצא.");

        participant.NotificationPreferences = prefs;
        eventRepo.Update(ev);
    }

    /// <summary>
    /// בודק שה-participantId שייך למשתמש המחובר — לפי AppUserId או email.
    /// </summary>
    public bool IsOwner(Guid eventId, Guid participantId, Guid callerId, string? callerUsername)
    {
        var ev = eventRepo.GetById(eventId);
        var p = ev?.Participants.FirstOrDefault(x => x.Id == participantId);
        if (p is null) return false;
        return (p.AppUserId != Guid.Empty && p.AppUserId == callerId)
            || (!string.IsNullOrWhiteSpace(callerUsername)
                && p.Email.Equals(callerUsername, StringComparison.OrdinalIgnoreCase));
    }
}
