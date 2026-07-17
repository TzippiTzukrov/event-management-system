using GatherUp.Core.Enums;
using GatherUp.Core.Events;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.BL.Services;

public class EventService(IRepository<GatherEvent> eventRepo, IEventNotifier notifier)
{
    public IEnumerable<GatherEvent> GetAll() => eventRepo.GetAll();

    public GatherEvent? GetById(Guid id) => eventRepo.GetById(id);

    public GatherEvent Create(GatherEvent gatherEvent)
    {
        if (string.IsNullOrWhiteSpace(gatherEvent.Title))
            throw new ValidationException("כותרת האירוע היא שדה חובה.");
        if (gatherEvent.EventDate is null)
            throw new ValidationException("תאריך האירוע הוא שדה חובה.");
        if (string.IsNullOrWhiteSpace(gatherEvent.Location))
            throw new ValidationException("מיקום האירוע הוא שדה חובה.");

        eventRepo.Add(gatherEvent);
        return gatherEvent;
    }

    public GatherEvent UpdateDetails(Guid id, UpdateEventDto dto)
    {
        var ev = eventRepo.GetById(id)
            ?? throw new NotFoundException($"אירוע {id} לא נמצא.");

        if (string.IsNullOrWhiteSpace(dto.Title))
            throw new ValidationException("כותרת האירוע היא שדה חובה.");

        ev.Title                  = dto.Title;
        ev.EventDate              = dto.EventDate;
        ev.Location               = dto.Location;
        ev.PricePerParticipant    = dto.PricePerParticipant;
        ev.CustomMessage          = dto.CustomMessage;
        ev.PaymentMethod          = dto.PaymentMethod;
        ev.BankDetails            = dto.BankDetails;
        ev.CashContactName        = dto.CashContactName;
        ev.InvitationScheduledAt  = dto.InvitationScheduledAt;
        ev.InvitationContent      = dto.InvitationContent ?? ev.InvitationContent;

        eventRepo.Update(ev);
        notifier.RaiseEventUpdated(new EventUpdatedEventArgs(ev.Id, ev.Title));
        return ev;
    }

    public void Delete(Guid id) => eventRepo.Delete(id);

    public EventHost SetHost(Guid eventId, EventHost host)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        ev.Host = host;
        eventRepo.Update(ev);
        return host;
    }

    public EventManager AddManager(Guid eventId, EventManager manager)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        ev.Managers.Add(manager);
        eventRepo.Update(ev);
        return manager;
    }

    public void RemoveManager(Guid eventId, Guid managerId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        var manager = ev.Managers.FirstOrDefault(m => m.Id == managerId)
            ?? throw new NotFoundException($"מנהל {managerId} לא נמצא באירוע.");
        ev.Managers.Remove(manager);
        eventRepo.Update(ev);
    }

    public void UpdateManagerNotifications(Guid eventId, Guid managerId, ManagerNotificationPreference prefs)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        var manager = ev.Managers.FirstOrDefault(m => m.Id == managerId)
            ?? throw new NotFoundException($"מנהל {managerId} לא נמצא באירוע.");
        manager.NotificationPreferences = prefs;
        eventRepo.Update(ev);
    }

    public void UpdateStatus(Guid id, EventStatus newStatus)
    {
        var ev = eventRepo.GetById(id)
            ?? throw new NotFoundException($"אירוע {id} לא נמצא.");
        ev.Status = newStatus;
        eventRepo.Update(ev);
    }
}
