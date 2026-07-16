using GatherUp.Core.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace GatherUp.Core.Models;

public class Poll : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "כותרת הסקר היא שדה חובה.")]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime? ClosesAt { get; set; }

    [System.Xml.Serialization.XmlIgnore]
    public bool IsClosed => ClosesAt.HasValue && DateTime.UtcNow > ClosesAt.Value;

    public List<PollQuestion> Questions { get; set; } = [];
}
