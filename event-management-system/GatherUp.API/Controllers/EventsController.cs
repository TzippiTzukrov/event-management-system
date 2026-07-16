using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Exceptions;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController(
    EventService eventService,
    NotificationService notificationService,
    AuthorizationService authorizationService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public IActionResult GetAll() => Ok(eventService.GetAll());

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public IActionResult GetById(Guid id)
    {
        var ev = eventService.GetById(id);
        return ev is null
            ? throw new NotFoundException($"אירוע {id} לא נמצא.")
            : Ok(ev);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public IActionResult Create(GatherEvent gatherEvent)
    {
        var created = eventService.Create(gatherEvent);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, GatherEvent gatherEvent)
    {
        if (id != gatherEvent.Id)
            throw new ValidationException("מזהה האירוע אינו תואם.");
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        return Ok(eventService.Update(gatherEvent));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        eventService.Delete(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPatch("{id:guid}/status")]
    public IActionResult UpdateStatus(Guid id, [FromBody] EventStatus newStatus)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        eventService.UpdateStatus(id, newStatus);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id:guid}/host")]
    public IActionResult SetHost(Guid id, EventHost host)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        return Ok(eventService.SetHost(id, host));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{id:guid}/managers")]
    public IActionResult AddManager(Guid id, EventManager manager)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        return Ok(eventService.AddManager(id, manager));
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:guid}/managers/{managerId:guid}")]
    public IActionResult RemoveManager(Guid id, Guid managerId)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        eventService.RemoveManager(id, managerId);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{id:guid}/send-invitations")]
    public IActionResult SendInvitations(Guid id)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        notificationService.SendInvitations(id);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost("{id:guid}/send-update")]
    public IActionResult SendUpdate(Guid id, [FromBody] string message)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), id))
            return Forbid();
        notificationService.SendEventUpdate(id, message);
        return NoContent();
    }

    private Guid CurrentUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private UserRole CurrentRole() =>
        Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)!.Value);
}
