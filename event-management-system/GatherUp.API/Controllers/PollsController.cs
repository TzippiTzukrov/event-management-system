using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/events/{eventId:guid}/polls")]
[Authorize]
public class PollsController(
    PollService pollService,
    AuthorizationService authorizationService) : ControllerBase
{
    [Authorize(Roles = "Admin,Manager,Participant")]
    [HttpGet]
    public IActionResult GetAll(Guid eventId) => Ok(pollService.GetPolls(eventId));

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public IActionResult Create(Guid eventId, Poll poll)
    {
        if (!authorizationService.IsManagerOrAdmin(CurrentUserId(), CurrentRole(), eventId))
            return Forbid();
        var created = pollService.AddPoll(eventId, poll);
        return CreatedAtAction(nameof(GetAll), new { eventId }, created);
    }

    /// <summary>
    /// הצבעה — רק משתתף של האירוע.
    /// </summary>
    [Authorize(Roles = "Participant")]
    [HttpPost("{pollId:guid}/questions/{questionId:guid}/vote")]
    public IActionResult Vote(Guid eventId, Guid pollId, Guid questionId, [FromBody] VoteRequest request)
    {
        if (!authorizationService.IsParticipantOfEvent(CurrentUserId(), eventId, CurrentUsername()))
            return Forbid();
        pollService.Vote(eventId, pollId, questionId, request.ParticipantId, request.Answer);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Manager,Participant")]
    [HttpGet("{pollId:guid}/questions/{questionId:guid}/results")]
    public IActionResult GetResults(Guid eventId, Guid pollId, Guid questionId)
        => Ok(pollService.GetResults(eventId, pollId, questionId));

    private Guid CurrentUserId() =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private string? CurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value;

    private UserRole CurrentRole() =>
        Enum.Parse<UserRole>(User.FindFirst(ClaimTypes.Role)!.Value);
}

public record VoteRequest(Guid ParticipantId, string Answer);
