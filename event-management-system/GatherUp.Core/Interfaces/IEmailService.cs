namespace GatherUp.Core.Interfaces;

public interface IEmailService
{
    void Send(string to, string subject, string htmlBody);
    void SendBulk(IEnumerable<string> recipients, string subject, string htmlBody);
}
