using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/financial")]
[Authorize(Roles = "Admin,Manager")]
public class FinancialController(
    FinanceService financeService,
    AuthorizationService authorizationService) : ControllerBase
{
    [HttpGet("vendors")]
    public IActionResult GetVendors(Guid eventId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        return Ok(financeService.GetVendors(eventId));
    }

    [HttpPost("vendors")]
    public IActionResult AddVendor(Guid eventId, VendorAllocation vendor)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        var added = financeService.AddVendor(eventId, vendor);
        return CreatedAtAction(nameof(GetVendors), new { eventId }, added);
    }

    [HttpDelete("vendors/{vendorId:guid}")]
    public IActionResult DeleteVendor(Guid eventId, Guid vendorId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        financeService.DeleteVendor(eventId, vendorId);
        return NoContent();
    }

    [HttpPost("vendors/{vendorId:guid}/receipt")]
    public IActionResult AttachReceipt(Guid eventId, Guid vendorId, ReceiptDetails receipt)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        financeService.AttachReceipt(eventId, vendorId, receipt);
        return NoContent();
    }

    [HttpPost("payments/{participantId:guid}")]
    public IActionResult MarkPayment(Guid eventId, Guid participantId, [FromBody] PaymentRequest request)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        financeService.MarkPayment(eventId, participantId, request.Amount, request.Method);
        return NoContent();
    }

    private Guid CurrentUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private UserRole CurrentRole() =>
        Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)!.Value);
}

public record PaymentRequest(decimal Amount, PaymentMethod Method);
