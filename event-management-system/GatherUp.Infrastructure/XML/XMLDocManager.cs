using System.Xml.Linq;

namespace GatherUp.Infrastructure.XML;

static class XMLDocManager
{
  public static XDocument Load(string path) =>
      XDocument.Load(path);

  public static void Save(XDocument doc, string path) =>
      doc.Save(path);

  public static XElement? GetElement(XDocument doc, string name) =>
      doc.Descendants(name).FirstOrDefault();

  public static IEnumerable<XElement> GetElements(XDocument doc, string name) =>
      doc.Descendants(name);

  public static void AddElement(XElement parent, XElement element) =>
      parent.Add(element);

  public static void RemoveElement(XElement element) =>
      element.Remove();

  public static string? GetAttributeValue(XElement element, string attributeName) =>
      element.Attribute(attributeName)?.Value;
}
