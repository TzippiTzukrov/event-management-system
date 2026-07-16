using GatherUp.Core.Enums;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.Infrastructure.Data;

public static class InitializeData
{
    public static void Seed(IRepository<GatherEvent> eventRepo)
    {
        var manager = new EventManager { Name = "ישראל ישראלי", Email = "avitall3560@gmail.com" };
        var host = new EventHost { Name = "שרה כהן", Email = "tzippi1588@gmail.com" };

        var participant1 = new Participant
        {
            Name = "משה לוי",
            Email = "tzippi1588@gmail.com",
            NotificationPreferences = NotificationPreference.EventChanges | NotificationPreference.NewPolls
        };
        var participant2 = new Participant
        {
            Name = "רחל דוד",
            Email = "avitall3560@gmail.com",
            NotificationPreferences = NotificationPreference.DirectMessages
        };

        var vendor = new VendorAllocation { Name = "קייטרינג אורות", AmountOwed = 2500 };

        var poll1 = new Poll
        {
            Title = "פרטי האירוע",
            Description = "שאלון מקדים לקביעת פרטי האירוע",
            ClosesAt = DateTime.Now.AddDays(7),
            Questions =
            [
                new PollQuestion { QuestionText = "מתי מתאים לכם?", Options = ["5 לינואר", "12 לינואר", "19 לינואר"] },
                new PollQuestion { QuestionText = "איפה מתאים לכם?", Options = ["תל אביב", "ירושלים", "חיפה"] }
            ]
        };

        var poll2 = new Poll
        {
            Title = "סגנון האירוע",
            Description = "סקר המשך לקביעת סגנון האירוע",
            ClosesAt = DateTime.Now.AddDays(14),
            Questions =
            [
                new PollQuestion { QuestionText = "איזה סגנון כיבוד?", Options = ["מזנון", "מנות אישיות", "בופה"] }
            ]
        };

        var gatherEvent = new GatherEvent
        {
            Title = "שבת גיבוש כיתה י'",
            EventDate = DateTime.Now.AddDays(30),
            Location = "אשקלון",
            PricePerParticipant = 150,
            Status = EventStatus.Draft,
            Host = host,
            Managers = [manager],
            Participants = [participant1, participant2],
            Vendors = [vendor],
            Polls = [poll1, poll2]
        };

        eventRepo.Add(gatherEvent);
    }
}
