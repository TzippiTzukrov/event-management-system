using GatherUp.BL;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using GatherUp.Infrastructure.Data;
using GatherUp.Infrastructure.Email;
using GatherUp.Infrastructure.Repositories;

UseXml();

void UseMemory()
{
    var repo = new MemoryRepository<GatherEvent>();
    Run(repo);
}

void UseXml()
{
    var xmlFolder = Path.Combine(AppContext.BaseDirectory, "XML");
    var receiptsFolder = Path.Combine(xmlFolder, "Receipts");
    Directory.CreateDirectory(xmlFolder);

    var repo = new XmlRepository<GatherEvent>(Path.Combine(xmlFolder, "events.xml"));
    var receiptRepo = new ReceiptXmlRepository(Path.Combine(xmlFolder, "receipts.xml"), receiptsFolder);

    Run(repo);
    TestReceipt(receiptRepo);
}

void Run(GatherUp.Core.Interfaces.IRepository<GatherEvent> repo)
{
    var emailService = new EmailService();
    var core = new GatherUpCore(repo, emailService);

    InitializeData.Seed(repo);

    var eventId = repo.GetAll().First().Id;

    // הוספת 3 משתתפים
    var p1 = new Participant { Name = "יוסי כהן",  Email = "yosi@test.com",  NotificationPreferences = NotificationPreference.EventChanges };
    var p2 = new Participant { Name = "דינה לוי",  Email = "dina@test.com",  NotificationPreferences = NotificationPreference.NewPolls };
    var p3 = new Participant { Name = "אבי מזרחי", Email = "avi@test.com",   NotificationPreferences = NotificationPreference.DirectMessages };

    Initialize.AddParticipantToEvent(repo, eventId, p1);
    Initialize.AddParticipantToEvent(repo, eventId, p2);
    Initialize.AddParticipantToEvent(repo, eventId, p3);

    // הוספת שאלה לסקר
    var e = repo.GetById(eventId)!;
    e.Polls[0].Questions.Add(new PollQuestion { QuestionText = "כמה אנשים תביאו?", Options = ["1", "2", "3+"] });
    repo.Update(e);

    // שינוי תשובה בסקר
    e = repo.GetById(eventId)!;
    e.Polls[0].Questions[0].Options[0] = "6 לינואר";
    repo.Update(e);

    // הדפסת כל המשתתפים
    Console.WriteLine("\nרשימת כל המשתתפים:");
    foreach (var p in repo.GetById(eventId)!.Participants)
        Console.WriteLine($"- {p.Name} | {p.Email}");
}

void TestReceipt(ReceiptXmlRepository receiptRepo)
{
    // יצירת קובץ דמה להעלאה
    var dummyFile = Path.Combine(AppContext.BaseDirectory, "sample_receipt.txt");
    File.WriteAllText(dummyFile, "קבלה לדוגמה");

    var receipt = new ReceiptDetails(Guid.NewGuid(), 350m, DateTime.Now, dummyFile);
    receiptRepo.Add(receipt);

    Console.WriteLine($"\nקבלה נוספה: {receipt.Id} | {receipt.Amount}₪");
}
