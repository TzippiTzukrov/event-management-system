using GatherUp.Core.Enums;

namespace GatherUp.API.Controllers;

public record UpdateEventDto(
    Guid     Id,
    string   Title,
    DateTime? EventDate,
    string?  Location,
    decimal? PricePerParticipant,
    string?  CustomMessage,
    PaymentMethod PaymentMethod,
    string?  BankDetails,
    string?  CashContactName,
    DateTime? InvitationScheduledAt,
    string?  InvitationContent
);
