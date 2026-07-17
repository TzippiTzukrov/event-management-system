using GatherUp.Core.Interfaces;

namespace GatherUp.Infrastructure.Email;

public class NoOpEmailService : IEmailService
{
    public void Send(string to, string subject, string htmlBody)
        => Console.WriteLine($"[EMAIL DISABLED] To: {to} | Subject: {subject}");

    public void SendBulk(IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var r in recipients)
            Send(r, subject, htmlBody);
    }
}
