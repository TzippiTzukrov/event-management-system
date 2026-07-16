using GatherUp.Core.Enums;
using GatherUp.Core.Events;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;

namespace GatherUp.BL.Services;

public class FinanceService(IRepository<GatherEvent> eventRepo, IEventNotifier notifier)
{
    public void MarkPayment(Guid eventId, Guid participantId, decimal amount, PaymentMethod method)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var participant = ev.Participants.FirstOrDefault(p => p.Id == participantId)
            ?? throw new NotFoundException($"משתתף {participantId} לא נמצא.");

        if (amount <= 0)
            throw new ValidationException("סכום התשלום חייב להיות חיובי.");

        if (ev.PaymentMethod != method)
            throw new BusinessRuleException(
                $"אמצעי התשלום '{method}' אינו תואם את שיטת התשלום שנקבעה לאירוע '{ev.PaymentMethod}'.");

        participant.HasPaid    = true;
        participant.AmountPaid = amount;
        eventRepo.Update(ev);

        notifier.RaisePayment(new PaymentEventArgs(eventId, participantId, participant.Name, amount));
    }

    public VendorAllocation AddVendor(Guid eventId, VendorAllocation vendor)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        if (string.IsNullOrWhiteSpace(vendor.Name))
            throw new ValidationException("שם הספק הוא שדה חובה.");

        if (vendor.AmountOwed < 0)
            throw new ValidationException("הסכום המגיע לספק לא יכול להיות שלילי.");

        ev.Vendors.Add(vendor);
        eventRepo.Update(ev);
        return vendor;
    }

    public void AttachReceipt(Guid eventId, Guid vendorId, ReceiptDetails receipt)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var vendor = ev.Vendors.FirstOrDefault(v => v.Id == vendorId)
            ?? throw new NotFoundException($"ספק {vendorId} לא נמצא.");

        vendor.Receipts.Add(receipt);
        eventRepo.Update(ev);
    }

    public IEnumerable<VendorAllocation> GetVendors(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");
        return ev.Vendors;
    }

    public void DeleteVendor(Guid eventId, Guid vendorId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        var vendor = ev.Vendors.FirstOrDefault(v => v.Id == vendorId)
            ?? throw new NotFoundException($"ספק {vendorId} לא נמצא באירוע.");

        ev.Vendors.Remove(vendor);
        eventRepo.Update(ev);
    }

    /// <summary>
    /// חישוב תקציב דינמי בשרשור LINQ — סך גבייה פחות חובות לספקים.
    /// </summary>
    public decimal GetBudget(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        return ev.Participants
                   .Where(p => p.IsAttending == true && p.HasPaid)
                   .Sum(p => p.AmountPaid)
               - ev.Vendors.Sum(v => v.AmountOwed);
    }

    /// <summary>
    /// שיטוח כל הקבלות מכל הספקים, ממוין לפי תאריך יורד — SelectMany.
    /// </summary>
    public IEnumerable<ReceiptDetails> GetAllReceiptsSorted(Guid eventId)
    {
        var ev = eventRepo.GetById(eventId)
            ?? throw new NotFoundException($"אירוע {eventId} לא נמצא.");

        return ev.Vendors
            .SelectMany(v => v.Receipts)
            .OrderByDescending(r => r.IssuedAt);
    }
}
