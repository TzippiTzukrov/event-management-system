using System.Xml.Linq;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Models;

namespace GatherUp.Infrastructure.Repositories;

public class ReceiptXmlRepository : XmlRepository<ReceiptDetails>
{
    private readonly string _xmlFilePath;
    private readonly string _receiptsFolder;

    public ReceiptXmlRepository(string xmlFilePath, string receiptsFolder) : base(xmlFilePath, useSerializer: false)
    {
        _xmlFilePath = xmlFilePath;
        _receiptsFolder = receiptsFolder;
        Directory.CreateDirectory(_receiptsFolder);
    }

    private XDocument LoadDoc() =>
        File.Exists(_xmlFilePath) ? XDocument.Load(_xmlFilePath) : new XDocument(new XElement("Receipts"));

    private void SaveDoc(XDocument doc) => doc.Save(_xmlFilePath);

    public override void Add(ReceiptDetails receipt)
    {
        var destPath = Path.Combine(_receiptsFolder, $"{receipt.Id}_{Path.GetFileName(receipt.FilePath)}");
        File.Copy(receipt.FilePath, destPath);

        var doc = LoadDoc();
        doc.Root!.Add(new XElement("Receipt",
            new XAttribute("Id", receipt.Id),
            new XElement("Amount", receipt.Amount),
            new XElement("IssuedAt", receipt.IssuedAt),
            new XElement("FilePath", destPath)));

        SaveDoc(doc);
    }

    public override ReceiptDetails? GetById(Guid id)
    {
        var doc = LoadDoc();
        var el = doc.Root!
            .Elements("Receipt")
            .FirstOrDefault(e => (Guid)e.Attribute("Id")! == id);

        if (el is null) return null;

        return new ReceiptDetails(
            id,
            decimal.Parse(el.Element("Amount")!.Value),
            DateTime.Parse(el.Element("IssuedAt")!.Value),
            el.Element("FilePath")!.Value);
    }

    public override void Update(ReceiptDetails entity) =>
        throw new BusinessRuleException("לא ניתן לערוך קבלה לאחר היצירה.");

    public override void Delete(Guid id) =>
        throw new BusinessRuleException("לא ניתן למחוק קבלה לאחר היצירה.");
}
