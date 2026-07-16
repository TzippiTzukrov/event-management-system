using GatherUp.Core.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace GatherUp.Core.Models;

public class VendorAllocation : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "שם הספק הוא שדה חובה.")]
    public string Name { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "הסכום המגיע לספק לא יכול להיות שלילי.")]
    public decimal AmountOwed { get; set; }

    [System.Xml.Serialization.XmlIgnore]
    public bool HasReceipt => Receipts.Count > 0;

    /// <summary>
    /// הקבלות נשמרות ב-ReceiptXmlRepository בנפרד.
    /// רשימה זו מאוכלסת בזמן ריצה בלבד — לא נכתבת לXML של האירוע.
    /// </summary>
    [System.Xml.Serialization.XmlIgnore]
    public List<ReceiptDetails> Receipts { get; set; } = [];
}
