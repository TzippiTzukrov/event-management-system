using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/persons")]
[Authorize(Roles = "Admin,Manager")]
public class PersonController(
    EventService eventService,
    AuthorizationService authorizationService) : ControllerBase
{
    [HttpPut("host")]
    public IActionResult SetHost(Guid eventId, EventHost host)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        return Ok(eventService.SetHost(eventId, host));
    }

    [HttpPost("managers")]
    public IActionResult AddManager(Guid eventId, EventManager manager)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        return Ok(eventService.AddManager(eventId, manager));
    }

    [HttpDelete("managers/{managerId:guid}")]
    public IActionResult RemoveManager(Guid eventId, Guid managerId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        eventService.RemoveManager(eventId, managerId);
        return NoContent();
    }

    [HttpPatch("managers/{managerId:guid}/notifications")]
    public IActionResult UpdateManagerNotifications(Guid eventId, Guid managerId, [FromBody] ManagerNotificationPreference prefs)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        eventService.UpdateManagerNotifications(eventId, managerId, prefs);
        return NoContent();
    }

    private Guid CurrentUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private UserRole CurrentRole() =>
        Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)!.Value);
}
