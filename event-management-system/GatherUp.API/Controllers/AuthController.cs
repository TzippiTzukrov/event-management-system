using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GatherUp.BL.Services;
using GatherUp.Core.Enums;
using GatherUp.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace GatherUp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService authService, IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        var user = authService.ValidateUser(request.Username, request.Password);
        if (user is null)
            return Unauthorized("שם משתמש או סיסמה שגויים.");

        return Ok(new { token = GenerateToken(user) });
    }

    /// <summary>
    /// Admin יוצר משתמש חדש. מחזיר פרטים + סיסמה זמנית.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("create-user")]
    public IActionResult CreateUser([FromBody] CreateUserRequest request)
    {
        var (user, plainPassword) = authService.CreateUser(
            request.Username, request.Role, request.Email ?? "");

        return Ok(new
        {
            user.Id,
            user.Username,
            Role = user.Role.ToString(),
            user.Email,
            temporaryPassword = plainPassword,
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public IActionResult GetUsers()
        => Ok(authService.GetAllUsers()
            .Select(u => new { u.Id, u.Username, Role = u.Role.ToString(), u.Email }));

    [Authorize(Roles = "Admin")]
    [HttpDelete("users/{id:guid}")]
    public IActionResult DeleteUser(Guid id)
    {
        authService.DeleteUser(id);
        return NoContent();
    }

    private string GenerateToken(AppUser user)
    {
        var key = configuration["Jwt:Key"] ?? "GatherUp_SuperSecret_Key_2024!@#$";
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name,           user.Username),
            new Claim(ClaimTypes.Role,           user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record LoginRequest(string Username, string Password);
public record CreateUserRequest(string Username, UserRole Role, string? Email);
