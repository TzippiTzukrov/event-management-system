using GatherUp.Core.Interfaces;

namespace GatherUp.Core.Models;

public abstract class Person : IIdentifiable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    private string _name = string.Empty;
    public required string Name
    {
        get => _name;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("שם לא יכול להיות ריק.");
            _name = value;
        }
    }

    private string _email = string.Empty;
    public required string Email
    {
        get => _email;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("אימייל לא יכול להיות ריק.");
            _email = value;
        }
    }

    /// <summary>
    /// תעודת זהות — מחרוזת של 9 ספרות.
    /// </summary>
    public string? IdNumber { get; set; }
}
