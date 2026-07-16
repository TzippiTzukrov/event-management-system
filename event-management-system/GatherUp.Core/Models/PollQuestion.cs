using GatherUp.Core.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace GatherUp.Core.Models;

public class PollQuestion : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "טקסט השאלה הוא שדה חובה.")]
    public string QuestionText { get; set; } = string.Empty;

    private List<string> _options = [];

    [MinLength(2, ErrorMessage = "שאלה חייבת לפחות שתי אפשרויות.")]
    public List<string> Options
    {
        get => _options;
        set
        {
            if (value is null)
                throw new ArgumentNullException(nameof(Options), "רשימת האפשרויות לא יכולה להיות null.");
            if (value.Count < 2)
                throw new ArgumentException("שאלה חייבת לפחות שתי אפשרויות.");
            _options = value;
        }
    }

    /// <summary>
    /// תשובות המשתתפים — מפתח: Id המשתתף, ערך: התשובה שבחר.
    /// נשמר ב-VotesXmlRepository בנפרד, לא בתוך ה-XML של האירוע.
    /// </summary>
    [System.Xml.Serialization.XmlIgnore]
    public Dictionary<Guid, string> VotesByParticipant { get; set; } = [];
}
