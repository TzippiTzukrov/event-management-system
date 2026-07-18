using GatherUp.Core.Interfaces;

namespace GatherUp.Core.Models;

public record ReceiptDetails(
    Guid Id,
    Guid VendorId,
    decimal Amount,
    DateTime IssuedAt,
    string FilePath
) : IIdentifiable;
