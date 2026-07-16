using GatherUp.Core.Events;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;
using GatherUp.Infrastructure.Repositories;

namespace GatherUp.BL.Services;

public class PollService(IRepository<GatherEvent> eventRepo, VotesXmlRepository votesRepo, IEventNotifier notifier)
{
    public Poll AddPoll(Guid eventId, Poll poll)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        if (string.IsNullOrWhiteSpace(poll.Title))
            throw new ValidationException("כותרת הסקר היא שדה חובה.");

        ev.Polls.Add(poll);
        eventRepo.Update(ev);

        notifier.RaisePollCreated(new PollCreatedEventArgs(eventId, ev.Title, poll.Title));
        return poll;
    }

    public IEnumerable<Poll> GetPolls(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        return ev.Polls;
    }

    /// <summary>
    /// הצבעה — אם הצביע כבר, מוחק את הישנה ושומר החדשה.
    /// </summary>
    public void Vote(Guid eventId, Guid pollId, Guid questionId, Guid participantId, string answer)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var poll = ev.Polls.FirstOrDefault(p => p.Id == pollId)
            ?? throw new NotFoundException($"סקר {pollId} לא נמצא.");

        if (poll.IsClosed)
            throw new BusinessRuleException("הסקר סגור ולא ניתן להצביע.");

        var question = poll.Questions.FirstOrDefault(q => q.Id == questionId)
            ?? throw new NotFoundException($"שאלה {questionId} לא נמצאה.");

        if (!question.Options.Contains(answer))
            throw new ValidationException($"תשובה '{answer}' אינה אפשרות חוקית.");

        // SaveVote מוחקת הצבעה קודמת פנימית לפני שמירת החדשה
        votesRepo.SaveVote(eventId, pollId, questionId, participantId, answer);

        question.VotesByParticipant[participantId] = answer;
        eventRepo.Update(ev);

        var participant = ev.Participants.FirstOrDefault(p => p.Id == participantId);
        notifier.RaiseVote(new VoteEventArgs(
            eventId, pollId, poll.Title,
            participantId, participant?.Name ?? participantId.ToString(), answer));
    }

    /// <summary>
    /// תוצאות הצבעה באחוזים — LINQ בלבד.
    /// </summary>
    public Dictionary<string, int> GetResults(Guid eventId, Guid pollId, Guid questionId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var poll = ev.Polls.FirstOrDefault(p => p.Id == pollId)
            ?? throw new NotFoundException($"סקר {pollId} לא נמצא.");

        if (poll.Questions.All(q => q.Id != questionId))
            throw new NotFoundException($"שאלה {questionId} לא נמצאה.");

        return votesRepo.LoadVotes(eventId, pollId, questionId)
            .GroupBy(v => v.Value)
            .ToDictionary(g => g.Key, g => g.Count());
    }
}
