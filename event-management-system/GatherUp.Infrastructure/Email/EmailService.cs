using GatherUp.Core.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace GatherUp.Infrastructure.Email;

public class EmailService(string from, string password, string host, int port) : IEmailService
{
    public void Send(string to, string subject, string htmlBody)
    {
        var message = BuildMessage(to, subject, htmlBody);
        SendMessage(message);
    }

    public void SendBulk(IEnumerable<string> recipients, string subject, string htmlBody)
    {
        foreach (var to in recipients)
            Send(to, subject, htmlBody);
    }

    private MimeMessage BuildMessage(string to, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };
        return message;
    }

    private void SendMessage(MimeMessage message)
    {
        using var client = new SmtpClient();
        client.Connect(host, port, SecureSocketOptions.StartTls);
        client.Authenticate(from, password);
        client.Send(message);
        client.Disconnect(true);
    }
}