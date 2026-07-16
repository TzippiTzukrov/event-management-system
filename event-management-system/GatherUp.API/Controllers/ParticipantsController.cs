using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/participants")]
[Authorize]
public class ParticipantsController(
    ParticipantService participantService,
    NotificationService notificationService,
    AuthorizationService authorizationService) : ControllerBase
{
    [Authorize(Roles = "Admin,Manager")]
    [HttpGet]
    public IActionResult GetAll(Guid eventId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        return Ok(participantService.GetParticipants(eventId));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public IActionResult Add(Guid eventId, Participant participant)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        var added = participantService.AddParticipant(eventId, participant);
        notificationService.SendWelcomeToParticipant(eventId, added);
        return CreatedAtAction(nameof(GetAll), new { eventId }, added);
    }

    /// <summary>
    /// עדכון RSVP — רק המשתתף עצמו יכול לעדכן את תגובתו.
    /// </summary>
    [Authorize(Roles = "Participant")]
    [HttpPatch("{participantId:guid}/rsvp")]
    public IActionResult UpdateRsvp(Guid eventId, Guid participantId, [FromBody] bool isAttending)
    {
        if (!authorizationService.IsParticipantOfEvent(CurrentUserId(), eventId, CurrentUsername()))
            return Forbid();
        participantService.UpdateRsvp(eventId, participantId, isAttending);
        return NoContent();
    }

    [Authorize(Roles = "Participant")]
    [HttpPatch("{participantId:guid}/notifications")]
    public IActionResult UpdateNotifications(Guid eventId, Guid participantId, [FromBody] NotificationPreference prefs)
    {
        if (!participantService.IsOwner(eventId, participantId, CurrentUserId(), CurrentUsername()))
            return Forbid();
        participantService.UpdateNotifications(eventId, participantId, prefs);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("send-payment-reminders")]
    public IActionResult SendPaymentReminders(Guid eventId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        notificationService.SendPaymentReminders(eventId);
        return NoContent();
    }

    private Guid CurrentUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private string? CurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value;

    private UserRole CurrentRole() =>
        Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)!.Value);
}
