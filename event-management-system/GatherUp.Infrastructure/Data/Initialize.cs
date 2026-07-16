using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.Infrastructure.Data;

public static class Initialize
{
    public static void AddEvent(IRepository<GatherEvent> repo, GatherEvent e) => 
        repo.Add(e);

    public static void AddParticipantToEvent(IRepository<GatherEvent> repo, Guid eventId, Participant participant)
    {
        var e = repo.GetById(eventId);
        if (e is null) throw new KeyNotFoundException($"Event {eventId} not found.");
        e.Participants.Add(participant);
        repo.Update(e);
    }

    public static void AddVendorToEvent(IRepository<GatherEvent> repo, Guid eventId, VendorAllocation vendor)
    {
        var e = repo.GetById(eventId);
        if (e is null) throw new KeyNotFoundException($"Event {eventId} not found.");
        e.Vendors.Add(vendor);
        repo.Update(e);
    }

    public static void AddPollToEvent(IRepository<GatherEvent> repo, Guid eventId, Poll poll)
    {
        var e = repo.GetById(eventId);
        if (e is null) throw new KeyNotFoundException($"Event {eventId} not found.");
        e.Polls.Add(poll);
        repo.Update(e);
    }
}
