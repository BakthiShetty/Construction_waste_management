# ReConX – Project Architecture

## 1. High-level architecture

    Angular 20 frontend
      Components, feature routes and guards
      Auth / Material / Request / Admin services
      HTTP interceptor and SignalR client
                |
                | HTTP + JSON + Bearer JWT
                v
    ASP.NET Core Web API (.NET 8)
      Controllers and DTOs
      Identity and JWT authorization
      EF Core, mail and activity-log services
      SignalR hub and QuestPDF reports
                |
                | Entity Framework Core
                v
    SQL Server
      Identity tables
      Materials / Requests / ActivityLogs

The frontend does not connect directly to SQL Server. It calls the API, and the API validates access and performs database operations.

## 2. Frontend organization

| Location | Responsibility |
|---|---|
| core/services/auth.ts | Login, registration, token storage, role state and profile |
| core/services/interceptor.ts | Adds the JWT Bearer header |
| core/services/material.ts | Material list, detail, create, update and delete calls |
| core/services/request.ts | Request creation, queries, status update and deletion |
| core/services/admin-service.ts | Admin data, PDF export and admin operations |
| core/services/signalr.ts | Connects to the hub and listens for MaterialPosted |
| core/guards | Authentication and role-based navigation |
| features/auth | Login, registration and password recovery |
| features/materials | Material management |
| features/requests | Donor and Receiver request flows |
| features/dashboard | Role-specific dashboards |
| features/admin | Admin screens and reports |
| shared | Reusable UI components |

Routes are lazy-loaded by feature. The root route configuration applies authentication and role guards to protected sections.

## 3. Backend request lifecycle

1. An Angular component calls a service method.
2. HttpClient sends the HTTP request.
3. The interceptor adds Authorization: Bearer <token> when a token exists.
4. ASP.NET Core validates the token's signature, issuer, audience and expiry.
5. Authorization attributes check the user's role.
6. The controller reads claims, validates input and executes business logic.
7. EF Core queries or updates SQL Server through ApplicationDbContext.
8. The controller returns an HTTP response to Angular.

## 4. Database entities

**ApplicationUser:** inherits from IdentityUser and adds Role and IsBlocked. Identity manages credential and role infrastructure, including user, role and user-role tables.

**Material:** Id, Name, Type, Description, Quantity, Price, Location, ImageUrl, PostedDate, IsAvailable and DonorId.

**Request:** Id, ReceiverId, MaterialId, Quantity, RequestedOn and Status. New requests are created with Pending status.

**ActivityLog:** Id, UserEmail, Role, Action and Timestamp (UTC).

## 5. Relationships

- Donor to Materials: one-to-many. Material.DonorId references the donor. Delete behavior is Restrict.
- Receiver to Requests: one-to-many. Request.ReceiverId references the receiver. Delete behavior is Restrict.
- Material to Requests: one-to-many. Request.MaterialId references the material. Delete behavior is Cascade.

These relationships are configured in ApplicationDbContext.OnModelCreating. Admin deletion operations also explicitly remove related records in some workflows.

## 6. Material creation flow

    Donor submits material form
           |
           v
    Angular MaterialService.create(FormData)
           |
           | POST /api/Materials
           v
    MaterialsController.Create
       - reads Donor ID from JWT claims
       - saves optional image under wwwroot/uploads
       - creates Material entity
       - calls SaveChangesAsync()
           |
           v
       SQL Server

The image receives a GUID-based file name. The resulting URL is stored in the Material record. Material browsing filters to IsAvailable = true, sorts newest first and returns selected donor information in a response DTO.

## 7. Request and stock flow

    Receiver submits material ID and quantity
           |
           v
    POST /api/Requests
       - material must exist and be available
       - quantity must be at least 1
       - quantity must not exceed current stock
       - create Request with Pending status
       - save to database
       - record activity log
       - attempt email to Donor
           |
           v
    Donor reviews request
           |
           v
    PUT /api/Requests?id={requestId}
       - load Request and Material
       - check sufficient stock if status is Approved
       - subtract request quantity
       - set IsAvailable=false if quantity becomes zero
       - update request status
       - save changes

The current approval path should be improved with explicit status-transition validation and a check that the authenticated Donor owns the material linked to the request. Stock updates should also be made concurrency-safe.

## 8. Authentication flow

1. Registration calls UserManager.CreateAsync and then AddToRoleAsync.
2. Login finds the user by email and checks the password using Identity.
3. Blocked users are rejected.
4. The API creates a JWT with NameIdentifier, Email and Role claims. It expires after three hours.
5. Angular stores the token in local storage and reads the role claim for UI state.
6. The interceptor attaches the token to requests.
7. Backend Authorize attributes enforce endpoint access.

Frontend guards are not the security boundary; backend authorization is.

## 9. Activity logging, email and reports

**Activity logs:** the active material and request controllers call ActivityLogService for selected create/update/delete actions. The service saves user email, role, action and UTC timestamp. Admins can query the logs.

**Email:** MailService uses SMTP settings from MailSettings. The code attempts to notify a Donor when a Receiver creates a request, affected Receivers when a Donor deletes a material, and users when an Admin changes role or block status.

**PDF:** AdminController supports users, materials and logs. With export=true, it creates a PDF using QuestPDF. User and material queries also support pagination with paginated, pageNumber and pageSize.

## 10. SignalR boundary

The backend maps MaterialHub to /hubs/materials. MaterialNotifierService uses IHubContext to broadcast a MaterialPosted event. Angular's SignalRService connects to that URL and registers a handler for the event.

The active MaterialsController.Create method does not currently inject or call MaterialNotifierService. The hub, notifier and client listener exist, but material creation does not yet publish the event. A complete flow requires calling the notifier after the database save succeeds.

## 11. Docker topology

Docker Compose defines:
- frontend: Angular production build served by NGINX on port 8080.
- backend: ASP.NET Core API on port 5004.
- db: SQL Server 2022 on port 1433 with a named persistent volume.

The frontend Dockerfile builds with Node 22 and serves the browser bundle with NGINX. The backend Dockerfile restores and publishes the solution project with the .NET 8 SDK, then runs it on the .NET 8 ASP.NET runtime.

Keep SQL, JWT and SMTP credentials outside source control. The current Compose file contains a committed SQL Server SA password; rotate it and replace it with an external environment variable or secret.
