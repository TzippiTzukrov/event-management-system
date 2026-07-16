using System.Xml.Linq;

namespace GatherUp.Infrastructure.Repositories;

public class VotesXmlRepository
{
    private readonly string _filePath;

    public VotesXmlRepository(string filePath)
    {
        _filePath = filePath;
    }

    private XDocument LoadDoc() =>
        File.Exists(_filePath)
            ? XDocument.Load(_filePath)
            : new XDocument(new XElement("Votes"));

    private void SaveDoc(XDocument doc) => doc.Save(_filePath);

    /// <summary>
    /// שמירת הצבעה.
    /// </summary>
    public void SaveVote(Guid eventId, Guid pollId, Guid questionId, Guid participantId, string answer)
    {
        var doc = LoadDoc();

        // מחיקת הצבעה קודמת של אותו משתתף על אותה שאלה
        doc.Root!
            .Elements("Vote")
            .Where(e =>
                (Guid)e.Attribute("EventId")! == eventId &&
                (Guid)e.Attribute("PollId")! == pollId &&
                (Guid)e.Attribute("QuestionId")! == questionId &&
                (Guid)e.Attribute("ParticipantId")! == participantId)
            .Remove();

        doc.Root!.Add(new XElement("Vote",
            new XAttribute("EventId", eventId),
            new XAttribute("PollId", pollId),
            new XAttribute("QuestionId", questionId),
            new XAttribute("ParticipantId", participantId),
            new XAttribute("Answer", answer),
            new XAttribute("VotedAt", DateTime.UtcNow)));

        SaveDoc(doc);
    }

    /// <summary>
    /// טעינת כל ההצבעות לשאלה מסוימת.
    /// מחזיר Dictionary&lt;participantId, answer&gt;.
    /// </summary>
    public Dictionary<Guid, string> LoadVotes(Guid eventId, Guid pollId, Guid questionId)
    {
        var doc = LoadDoc();
        return doc.Root!
            .Elements("Vote")
            .Where(e =>
                (Guid)e.Attribute("EventId")! == eventId &&
                (Guid)e.Attribute("PollId")! == pollId &&
                (Guid)e.Attribute("QuestionId")! == questionId)
            .ToDictionary(
                e => (Guid)e.Attribute("ParticipantId")!,
                e => e.Attribute("Answer")!.Value);
    }

    /// <summary>
    /// טעינת כל ההצבעות לסקר שלם (לכל שאלותיו).
    /// מחזיר Dictionary&lt;questionId, Dictionary&lt;participantId, answer&gt;&gt;.
    /// </summary>
    public Dictionary<Guid, Dictionary<Guid, string>> LoadPollVotes(Guid eventId, Guid pollId)
    {
        var doc = LoadDoc();
        return doc.Root!
            .Elements("Vote")
            .Where(e =>
                (Guid)e.Attribute("EventId")! == eventId &&
                (Guid)e.Attribute("PollId")! == pollId)
            .GroupBy(e => (Guid)e.Attribute("QuestionId")!)
            .ToDictionary(
                g => g.Key,
                g => g.ToDictionary(
                    e => (Guid)e.Attribute("ParticipantId")!,
                    e => e.Attribute("Answer")!.Value));
    }
}
