# ReConX – Construction Waste Exchange Platform

ReConX is a role-based web application for exchanging reusable construction materials. Donors publish surplus materials, Receivers browse listings and submit quantity-based requests, and Admins manage users, materials and activity records.

## Features

- **Donors:** create, view, update and delete material listings; include quantity, price, location, description and an optional image; review and approve requests.
- **Receivers:** browse available materials, submit quantity-based requests, view and delete their requests.
- **Admins:** view users, materials and activity logs; paginate user/material data; export PDF reports; change roles, block/unblock accounts and delete users/materials.
- **Notifications:** SMTP email is attempted for selected request, material-deletion and account-administration events.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | Angular 20, TypeScript, Angular Material, SCSS, RxJS |
| Backend | C#, ASP.NET Core Web API, .NET 8 |
| ORM | Entity Framework Core 8 |
| Database | Microsoft SQL Server |
| Authentication | ASP.NET Core Identity, JWT Bearer |
| Real-time foundation | ASP.NET Core SignalR, @microsoft/signalr |
| Supporting tools | Swagger, Serilog, AutoMapper registration, QuestPDF |
| Deployment | Docker, Docker Compose, NGINX |

## Repository structure

- BackendApi/BackendApi.sln – backend solution.
- BackendApi/BackendApi/ – backend project referenced by the solution.
- cwaste/ – Angular application.
- docker-compose.yml – frontend, backend and SQL Server services.
- PROJECT_EXPLANATION.md – interview project overview.
- PROJECT_ARCHITECTURE.md – frontend, backend and database flow.
- TECHNICAL_INTERVIEW.md – technical concepts tied to the code.
- PROJECT_INTERVIEW_QA.md – project-specific interview questions.
- RESUME_POINTS.md – resume-ready descriptions.

**Backend project note:** The solution references BackendApi/BackendApi/BackendApi.csproj, and the backend Dockerfile builds that nested project. A second project file exists at BackendApi/BackendApi.csproj; it is not referenced by the solution.

## How it works

1. A user registers with a role and signs in.
2. ASP.NET Core Identity validates credentials and the API returns a JWT containing user ID, email and role claims.
3. Angular stores the token in local storage. Its HTTP interceptor adds the Bearer token to API requests.
4. Angular route guards control access to role-specific sections.
5. The API validates JWTs and enforces roles on protected endpoints.
6. Entity Framework Core reads and writes application data in SQL Server.
7. The backend uses SMTP for selected email notifications.

## Run locally

### Prerequisites
- .NET 8 SDK
- Node.js 22
- SQL Server
- npm

### Backend

Configure the DefaultConnection connection string and Jwt settings (Key, Issuer and Audience) using local configuration, .NET User Secrets or environment variables. Configure MailSettings if email delivery is required. Do not commit real credentials.

From the repository root:

    cd BackendApi
    dotnet restore BackendApi.sln
    dotnet run --project BackendApi/BackendApi.csproj

The configured API port is 5004. Swagger is enabled in Development.

### Frontend

The API base URL is in cwaste/src/environments/environment.ts.

    cd cwaste
    npm install
    npm start

Angular normally runs at http://localhost:4200. The active backend CORS policy allows http://localhost:8080, the Docker/NGINX frontend origin. For direct ng serve development, update the backend CORS policy to allow the development-server origin.

### Docker Compose

From the repository root:

    docker compose up --build

Compose maps the frontend to port 8080, API to port 5004 and SQL Server to port 1433. SQL Server data uses a named Docker volume.

**Credential warning:** docker-compose.yml currently contains a hard-coded SQL Server SA password. Treat it as exposed because it is committed to source control. Rotate it and move credentials to environment variables or an untracked local environment file before sharing or deploying.

## Database overview

ApplicationDbContext extends IdentityDbContext<ApplicationUser> and adds Materials, Requests and ActivityLogs alongside ASP.NET Core Identity tables.

- ApplicationUser extends IdentityUser with Role and IsBlocked.
- Material stores listing details, quantity, price, location, image URL, availability and DonorId.
- Request stores ReceiverId, MaterialId, requested quantity, date and status.
- ActivityLog stores user email, role, action and UTC timestamp.

EF Core migrations are in BackendApi/BackendApi/Migrations. The active startup code applies pending migrations and seeds roles and an initial user.

## API overview

| Area | Examples |
|---|---|
| Authentication | POST /api/Auth/register, POST /api/Auth/login, GET /api/Auth/me |
| Materials | GET /api/Materials?type=all, GET /api/Materials?type=mine, GET /api/Materials?type=single&id={id}, POST /api/Materials |
| Requests | POST /api/Requests, GET /api/Requests?type=my, GET /api/Requests?type=mine, PUT /api/Requests?id={id} |
| Admin | GET /api/Admin?type=users, GET /api/Admin?type=materials, GET /api/Admin?type=logs |
| SignalR hub | /hubs/materials |

## Current implementation boundaries

- The SignalR hub, Angular listener and backend notifier service exist. However, the active material creation controller does not call NotifyMaterialPosted, so material creation does not currently broadcast that event.
- Admin data and PDF-export GET endpoints exist. Some Angular admin PATCH/DELETE methods use path-based URLs, while backend actions expect query parameters; align these routes before relying on those UI actions.
- The reports screen generates some display metadata, such as sample record counts and last-generated labels, on the frontend. PDF downloads call the backend.
- Email delivery depends on valid SMTP configuration.
- JWTs are currently stored in browser local storage.
