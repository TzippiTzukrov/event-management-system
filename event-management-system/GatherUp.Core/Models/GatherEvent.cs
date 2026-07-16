using GatherUp.Core.Enums;
using GatherUp.Core.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.Xml.Serialization;

namespace GatherUp.Core.Models;

public class GatherEvent : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "כותרת האירוע היא שדה חובה.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "תאריך האירוע הוא שדה חובה.")]
    public DateTime? EventDate { get; set; }

    [Required(ErrorMessage = "מיקום האירוע הוא שדה חובה.")]
    public string? Location { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "המחיר למשתתף חייב להיות אפס או יותר.")]
    public decimal? PricePerParticipant { get; set; }

    public string? CustomMessage { get; set; }

    public EventStatus Status { get; set; } = EventStatus.Draft;

    /// <summary>
    /// שיטת התשלום נקבעת ברמת האירוע — כל המשתתפים משלמים באותה דרך.
    /// האירוע מחליט (לא כל משתתף בנפרד) כדי לפשט את הניהול הפיננסי.
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;

    public string? BankDetails { get; set; }
    public string? CashContactName { get; set; }

    // --- פרטי ההזמנה שייכים לאירוע, לא לבעל האירוע ---
    public DateTime? InvitationScheduledAt { get; set; }
    public string InvitationContent { get; set; } = string.Empty;

    public EventHost? Host { get; set; }
    public List<EventManager> Managers { get; set; } = [];

    /// <summary>
    /// רשימת המשתתפים — כל אחד עם הפרטים האישיים שלו בלבד.
    /// VotesByParticipant ו-AmountPaid נשמרים בנפרד (לא כאן).
    /// </summary>
    [XmlArray("Participants")]
    [XmlArrayItem("Participant")]
    public List<Participant> Participants { get; set; } = [];

    /// <summary>
    /// ספקים — הקבלות שלהם נשמרות ב-ReceiptXmlRepository בנפרד.
    /// </summary>
    [XmlArray("Vendors")]
    [XmlArrayItem("Vendor")]
    public List<VendorAllocation> Vendors { get; set; } = [];

    /// <summary>
    /// סקרים — השאלות נשמרות כאן, אך התשובות נשמרות ב-VotesXmlRepository בנפרד.
    /// </summary>
    [XmlArray("Polls")]
    [XmlArrayItem("Poll")]
    public List<Poll> Polls { get; set; } = [];

    [XmlIgnore]
    public decimal TotalCollected => Participants
        .Where(p => p.HasPaid)
        .Sum(p => p.AmountPaid);

    [XmlIgnore]
    public decimal TotalOwedToVendors => Vendors.Sum(v => v.AmountOwed);

    [XmlIgnore]
    public decimal Budget => TotalCollected - TotalOwedToVendors;
}
