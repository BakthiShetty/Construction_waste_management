# Technical Interview Notes – ReConX

This guide connects the technologies to their use in the repository.

## Angular 20

**What is Angular?** A TypeScript frontend framework for building component-based single-page applications. It provides routing, dependency injection, forms and HttpClient.

**How is it used here?** The application is organized into feature areas for authentication, materials, requests, dashboards and administration. Services centralize API calls. Angular Material and SCSS support the UI, and RxJS Observables handle asynchronous data.

**Lazy loading:** Loads a feature's route code only when the user navigates to it. The root route configuration uses dynamic imports for feature route groups.

**Services:** Injectable classes that contain reusable logic. MaterialService handles material API calls; RequestService handles request calls; AuthService handles authentication and token state.

**HTTP interceptor:** A class that can inspect or modify outgoing requests. AuthInterceptorService reads the JWT from AuthService and clones the request with an Authorization Bearer header.

**Route guards:** Client-side navigation checks. This app uses authentication and role guards. They improve navigation but do not replace backend security.

## C# and ASP.NET Core Web API

ASP.NET Core Web API provides controller-based HTTP endpoints. Controllers receive requests, invoke application logic and return HTTP responses.

- AuthController: registration, login, profile and password recovery.
- MaterialsController: material listing, create, update and delete.
- RequestsController: create, query, update status and delete requests.
- AdminController: user/material/log data, pagination, PDF export, account changes and deletion.
- ContactController: sends contact messages through the mail service.

**Dependency injection:** the framework supplies a class with the services it needs. Program.cs registers the DbContext, Identity, mail, activity-log and application services, which controllers receive through constructors.

**Async/await:** database and network operations are I/O-bound. Methods such as ToListAsync, SaveChangesAsync and SendMailAsync avoid blocking a request thread while waiting for I/O.

**Middleware:** components form the HTTP pipeline. Program.cs configures request logging, HTTPS redirection, CORS, authentication and authorization before mapping controllers and the SignalR hub.

## SQL Server and Entity Framework Core

**EF Core:** an object-relational mapper that maps C# entities to relational tables and supports querying/updating through LINQ and DbContext.

**DbContext:** the unit-of-work/database context. ApplicationDbContext inherits from IdentityDbContext<ApplicationUser> and exposes Materials, Requests and ActivityLogs.

**Migration:** a versioned schema change generated from the EF model. Migrations are stored in BackendApi/BackendApi/Migrations. Startup checks for pending migrations and applies them.

**Relationships:** one Donor to many Materials; one Receiver to many Requests; one Material to many Requests. Material-to-request uses Cascade delete. The user relationships use Restrict delete.

**Include():** eager-loads a related entity. Material queries include Donor when donor information is needed; request queries include Material or Receiver data.

**LINQ:** used to filter available materials, select a user's own records, order by PostedDate, project DTOs and paginate with Skip/Take.

**Inventory update:** when a Donor approves a request, the API checks remaining stock, subtracts the requested quantity and sets IsAvailable to false if stock reaches zero.

## REST APIs

REST uses HTTP methods to operate on resources.

| Method | Meaning | Project example |
|---|---|---|
| GET | Read | Browse available materials |
| POST | Create | Create material or request |
| PUT | Update | Update material or request status |
| PATCH | Partial update | Admin role/block operation |
| DELETE | Delete | Delete a request or material |

**DTO:** a Data Transfer Object defines fields accepted or returned by an endpoint. Examples include LoginDto, RegisterDto, MaterialDto, CreateRequestDto and UpdateRequestStatusDto.

**multipart/form-data:** used because a material form can contain text fields and an image file. The API binds the form to MaterialDto, saves the file and stores its URL.

Common responses include 200 (success), 400 (invalid input), 401 (unauthorized), 404 (not found) and 204 (successful deletion with no body).

## Authentication and authorization

Authentication establishes who the user is. ASP.NET Core Identity validates credentials.

Authorization determines what an authenticated user may do. Attributes such as [Authorize(Roles = "Donor")] restrict protected endpoints.

**JWT:** a signed JSON token that carries claims. Login issues a token with NameIdentifier, Email and Role claims, signed using HMAC SHA-256 and configured to expire after three hours. The API validates issuer, audience, expiry and signing key.

**Why Identity?** Identity provides password hashing, user management, roles and password-reset tokens. The application uses UserManager and RoleManager rather than storing plaintext passwords.

**Are frontend guards enough?** No. A user can call an API without using Angular. Backend JWT validation and role authorization protect the actual data and operations.

## SignalR

SignalR is an ASP.NET Core library for real-time server-to-client communication. It can use WebSockets when available and negotiate other transports.

- Program.cs registers SignalR and maps MaterialHub to /hubs/materials.
- MaterialNotifierService uses IHubContext to broadcast MaterialPosted.
- Angular uses @microsoft/signalr to connect and subscribe to MaterialPosted.
- SignalRService exposes received data through an Observable.

**Current status:** the notifier is registered, but MaterialsController.Create does not call NotifyMaterialPosted. The hub and client listener are present, but the material-posting flow is not yet publishing the event. The next step is to call the notifier after the material has been saved and test the event end to end.

## Email, activity logging and PDF

**Email:** MailService uses SMTP settings from configuration. The code attempts email for new requests, material deletion notifications and admin role/block changes.

**Activity logging:** ActivityLogService saves email, role, action and UTC timestamp in ActivityLogs. Current material and request controller actions log selected create/update/delete operations.

**PDF:** AdminController uses QuestPDF to generate user, material and activity-log reports. Angular requests the PDF as a Blob and triggers a browser download.

## Docker

Docker packages applications and runtime dependencies into containers. This project builds Angular with Node 22 and serves it with NGINX, publishes the API with the .NET 8 SDK and runs it on the .NET 8 ASP.NET runtime, and uses Compose for frontend, backend and SQL Server. SQL Server data is stored in a named volume.

## Improvement topics

1. Call the SignalR notifier from material creation and test the event.
2. Align Angular admin PATCH/DELETE URLs with backend query-based routes.
3. Validate request status transitions and verify Donor ownership before approval.
4. Verify a Receiver can delete only their own request.
5. Make stock decrement concurrency-safe to prevent overselling.
6. Validate uploaded file content and size and improve file storage practices.
7. Rotate the committed database password and move secrets outside source control.
8. Review token storage, HTTPS and CORS for production.
9. Add integration tests for authentication, roles, materials and request stock updates.
10. Replace simulated report metadata with API-backed values.
