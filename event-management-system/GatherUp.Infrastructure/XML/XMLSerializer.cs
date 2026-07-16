namespace GatherUp.Infrastructure.XML;

/// <summary>
/// עטיפה ל-XmlSerializer הסטנדרטי.
/// כל פעולה פותחת ועושה Dispose ל-FileStream בעצמה — אין פתיחה כפולה.
/// </summary>
static class XMLSerializer
{
    public static void Serialize<T>(string path, T obj) where T : class, new()
    {
        // פותחים את הקובץ פעם אחת כאן בלבד — לא יוצרים FileStream נוסף בתוך הפונקציה
        var serializer = new System.Xml.Serialization.XmlSerializer(typeof(T));
        using var fileStream = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        serializer.Serialize(fileStream, obj);
    }

    public static T Deserialize<T>(string path) where T : class, new()
    {
        if (!File.Exists(path))
            throw new FileNotFoundException($"קובץ ה-XML לא נמצא: {path}");

        var serializer = new System.Xml.Serialization.XmlSerializer(typeof(T));
        using var fileStream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (T?)serializer.Deserialize(fileStream)
            ?? throw new InvalidOperationException($"הסריאליזציה החזירה null עבור: {path}");
    }
}