using GatherUp.Core.Interfaces;

namespace GatherUp.Core.Models;

public record ReceiptDetails(
    Guid Id,
    decimal Amount,
    DateTime IssuedAt,
    string FilePath
) : IIdentifiable;
