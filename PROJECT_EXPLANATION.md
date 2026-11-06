# ReConX – Project Explanation for Interviews

## Introduction

ReConX is a construction-material exchange platform intended to make reusable surplus materials easier to discover and request. It connects Donors, who publish material listings, with Receivers, who browse listings and request quantities. Admins manage users, materials and activity records.

The project is a listing-and-request application, not a construction project planning or contractor-management system.

## User roles

**Donor:** registers and signs in; creates material listings; views, edits and deletes their listings; reviews incoming requests; approves requests. A listing contains name, type, description, quantity, price, location and an optional image.

**Receiver:** registers and signs in; browses available materials; views details; submits a quantity-based request; views and deletes their requests.

**Admin:** views users, materials and activity logs; paginates user/material data; exports PDF reports; changes roles; blocks/unblocks accounts; deletes users or materials.

## Main workflow

1. Registration sends user details to POST /api/Auth/register. The backend creates the user through ASP.NET Core Identity and adds the selected role.
2. Login sends credentials to POST /api/Auth/login. The backend checks the password and blocked-account flag, then returns a JWT with user ID, email and role claims.
3. Angular stores the JWT in local storage. An HTTP interceptor attaches it as a Bearer token.
4. A Donor submits a multipart material form. The API saves an optional image under wwwroot/uploads and stores the listing in SQL Server.
5. A Receiver browses available materials. The API filters by IsAvailable, sorts newest first and returns selected donor information.
6. A Receiver submits a material ID and quantity. The API validates availability and quantity, creates a Pending request and attempts to email the Donor.
7. When the Donor approves a request, the API subtracts the requested quantity and marks the material unavailable if stock reaches zero.
8. Admin endpoints provide user/material/log queries, pagination, PDF export, role/block operations and deletion.

## Architecture

**Angular frontend:** core services handle authentication, HTTP interception, materials, requests, admin operations and SignalR. Feature areas cover authentication, materials, requests, dashboards and administration. Routes are lazy-loaded and protected with authentication and role guards.

**ASP.NET Core backend:** the active solution project is BackendApi/BackendApi/BackendApi.csproj. It contains controllers, DTOs, EF Core models, ApplicationDbContext, migrations, services and a SignalR hub.

**Database:** ApplicationDbContext extends IdentityDbContext<ApplicationUser> and adds Materials, Requests and ActivityLogs. Identity manages user credentials and role tables.

## Design decisions

- **Role-based access:** Donor, Receiver and Admin have different permissions. Backend authorization attributes enforce access; frontend guards only control navigation.
- **DTOs:** define the fields accepted or returned by API operations. MaterialDto is used for multipart material forms; CreateRequestDto carries material ID and quantity.
- **Entity Framework Core:** maps C# entities to SQL Server, supports LINQ queries and change tracking, and manages schema changes through migrations.
- **JWT:** lets the separate Angular client send a signed token with API requests. The API validates the token and reads its claims.
- **Activity logs:** selected material and request operations record the user's email, role, action and timestamp.
- **PDF export:** admins can export users, materials and activity logs using QuestPDF.

## Implementation boundaries

- SignalR is configured at /hubs/materials. The Angular client listens for MaterialPosted and a backend notifier can broadcast it, but the active material creation controller does not call the notifier. Describe it as a real-time notification foundation that still needs to be wired into the posting flow.
- The reports page simulates some display metadata in the browser. The PDF export endpoint is implemented.
- Some Angular admin PATCH/DELETE URLs do not match the backend's query-based actions.
- Email requires valid SMTP configuration.
- The current frontend stores JWTs in local storage.

## 30-second interview answer

“ReConX is a role-based construction-material exchange platform. Donors can publish surplus materials with details such as type, quantity, price and location. Receivers can browse available listings and request a quantity. When a Donor approves a request, the backend reduces the available stock and marks the listing unavailable if the stock reaches zero. Admins can manage users and materials, inspect activity logs and export reports.

I built it using Angular 20, ASP.NET Core Web API on .NET 8, Entity Framework Core and SQL Server. Authentication uses ASP.NET Core Identity and JWT, with role-based authorization for Donor, Receiver and Admin operations. The backend also includes SMTP email integration, activity logging, PDF export and a SignalR hub for material notifications.”
