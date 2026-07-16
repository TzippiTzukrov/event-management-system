using GatherUp.Core.Exceptions;
using System.Text.Json;

namespace GatherUp.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            NotFoundException          => (StatusCodes.Status404NotFound,    ex.Message),
            ValidationException        => (StatusCodes.Status400BadRequest,  ex.Message),
            BusinessRuleException      => (StatusCodes.Status400BadRequest,  ex.Message),
            _                          => (StatusCodes.Status500InternalServerError, "אירעה שגיאה פנימית בשרת.")
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode  = statusCode;

        var body = JsonSerializer.Serialize(new { error = message });
        await context.Response.WriteAsync(body);
    }
}
