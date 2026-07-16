using System.Text;
using GatherUp.API.Middleware;
using GatherUp.BL.Services;
using GatherUp.Core.Interfaces;
using GatherUp.Core.Models;
using GatherUp.Infrastructure.Email;
using GatherUp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// --- Controllers + Swagger ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            []
        }
    });
});

// --- JWT ---
var jwtKey = builder.Configuration["Jwt:Key"] ?? "GatherUp_SuperSecret_Key_2024!@#$";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
builder.Services.AddAuthorization();

// --- Data paths ---
var dataPath = Path.Combine(AppContext.BaseDirectory, "Data");
Directory.CreateDirectory(dataPath);

// --- Repositories ---
builder.Services.AddSingleton<IRepository<GatherEvent>>(
    _ => new XmlRepository<GatherEvent>(Path.Combine(dataPath, "events.xml")));
builder.Services.AddSingleton<IUserRepository>(
    _ => new UserRepository(Path.Combine(dataPath, "users.xml")));
builder.Services.AddSingleton(
    _ => new VotesXmlRepository(Path.Combine(dataPath, "votes.xml")));

// --- Infrastructure ---
var emailConfig = builder.Configuration.GetSection("Email");
builder.Services.AddSingleton<IEmailService>(_ => new EmailService(
    emailConfig["From"]!,
    emailConfig["Password"]!,
    emailConfig["Host"]!,
    int.Parse(emailConfig["Port"]!)
));

// --- Services ---
builder.Services.AddSingleton<IEventNotifier, EventNotifier>();
builder.Services.AddScoped<EventService>();
builder.Services.AddScoped<ParticipantService>();
builder.Services.AddScoped<PollService>();
builder.Services.AddScoped<FinanceService>();
builder.Services.AddSingleton<NotificationService>(); // Singleton כי נרשם ל-events
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AuthorizationService>();

var app = builder.Build();

// --- Swagger UI ---
app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// רישום NotificationService לכל ה-events — פעם אחת ב-startup
app.Services.GetRequiredService<NotificationService>().RegisterToEvents();

app.MapControllers();

app.Run();
