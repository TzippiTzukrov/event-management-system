# GatherUp — Event Management System

A full-featured event management system with a user interface, API, participant management, polls, and financials.

---

## Screenshots

### Login
![Login](event-management-system/screenshots/login.png)

### Manager Dashboard
![Manager Dashboard](event-management-system/screenshots/events_manager_dashboard.png)

### User Dashboard
![User Dashboard](event-management-system/screenshots/user_dashboard.png)

### Polls — Manager View
![Polls](event-management-system/screenshots/polls_manager_dashboard.png)

### Finance — Manager View
![Finance](event-management-system/screenshots/manager%20finance.png)

---

## Tech Stack

**Backend**
- .NET 8 — Web API
- JWT Authentication
- XML-based persistence (no database)
- BCrypt for password hashing
- SMTP for email sending

**Frontend**
- React 19 + TypeScript
- Vite
- React Router v7

---

## Project Structure

```
event-management-system/
├── GatherUp.API/            # Web API — Controllers, Middleware, Program.cs
│   └── Properties/          # launchSettings.json (port 5000)
├── GatherUp.BL/             # Business logic — Services
├── GatherUp.Core/           # Models, Interfaces, Enums, Exceptions, DTOs
├── GatherUp.Infrastructure/ # Repositories (XML), Email
│   └── Data/                # Runtime XML files (gitignored)
├── GatherUp.Client/         # React frontend (Vite + TypeScript)
├── GatherUp.Tests/          # Manual integration tests
├── screenshots/             # UI screenshots
├── GatherUp.slnx            # Solution file
└── .gitignore
```

---

## Running Locally

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/)

### 1. Configure appsettings

In `GatherUp.API/`, copy `appsettings.Example.json` to `appsettings.json` and fill in your values:

```json
{
  "Jwt": {
    "Key": "YOUR_SECRET_KEY_MIN_32_CHARS"
  },
  "Email": {
    "From": "your-email@example.com",
    "Password": "your-smtp-password",
    "Host": "smtp.example.com",
    "Port": "587"
  }
}
```

> If `Email` is not configured — the system starts normally and skips email sending.  
> If `Jwt:Key` is not configured — a default insecure key is used with a console warning. **Do not skip this in production.**

### 2. Start the API

```bash
cd event-management-system/GatherUp.API
dotnet run
```

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

### 3. Start the client

```bash
cd event-management-system/GatherUp.Client
npm install
npm run dev
```

- Client: `http://localhost:5173`

---

## Default Users

| Username | Password   | Role          |
|----------|------------|---------------|
| admin    | admin123   | System Admin  |
| manager  | manager123 | Event Manager |

---

## Key Features

- **Event Management** — Create, edit, change status (Draft → Active → Completed)
- **Participants** — Add participants, RSVP, manage notifications
- **Polls** — Create polls with questions, voting, and results
- **Financials** — Track payments, vendors, and receipts
- **Invitations** — Send email invitations to participants
- **Authorization** — Admin / Manager / Participant roles with protected endpoints
