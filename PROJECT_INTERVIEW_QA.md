# ReConX – Project-Specific Interview Q&A

These answers describe the implementation in this repository. Use them as a guide, not as memorized scripts.

## Project overview

**1. What is your project?**  
ReConX is a construction-material exchange platform. Donors publish surplus material listings, Receivers browse and request quantities, and Admins manage users, materials and activity records.

**2. What problem does it solve?**  
Usable construction materials can remain unused at one location while another person or project needs them. The platform provides a common listing-and-request workflow to help those materials be discovered and reused.

**3. What are the user roles?**  
Donor, Receiver and Admin. Donors manage listings and incoming requests; Receivers browse materials and submit requests; Admins manage users, materials and reports.

**4. Explain the architecture.**  
Angular sends HTTP requests to an ASP.NET Core Web API. The API validates JWT authentication and role authorization, executes controller logic and uses EF Core to access SQL Server. SMTP handles selected emails. A SignalR hub is configured for material notifications.

**5. Explain the main workflow.**  
A Donor creates a material listing. A Receiver browses and submits a quantity request. The API validates the material and quantity and creates a Pending request. When the Donor approves it, the API reduces stock and marks the material unavailable if the quantity reaches zero.

## Angular

**6. Why Angular?**  
Angular provides components, routing, dependency injection, forms and HttpClient. These features support separate role-based dashboards and feature areas.

**7. Why use services?**  
Services centralize reusable logic and API calls. MaterialService handles materials, RequestService handles requests, and AuthService handles login and token state.

**8. How are frontend routes protected?**  
The route configuration applies authGuard and roleGuard to protected feature groups. These guards control navigation; backend authorization still protects the API.

**9. How does the JWT reach the backend?**  
AuthService stores it in local storage under auth_token. AuthInterceptorService adds Authorization: Bearer <token> to outgoing requests.

**10. What is RxJS used for?**  
HttpClient returns Observables for asynchronous API calls. AuthService also uses a BehaviorSubject to expose role changes to components.

## Backend and database

**11. Why ASP.NET Core Web API?**  
It provides controller-based endpoints, dependency injection, middleware, built-in authentication/authorization integration and EF Core support.

**12. What does ApplicationDbContext do?**  
It is the EF Core database context. It inherits from IdentityDbContext<ApplicationUser> and exposes Materials, Requests and ActivityLogs.

**13. What are the main tables?**  
Materials, Requests and ActivityLogs are the main application entities. Identity manages user and role tables such as AspNetUsers, AspNetRoles and AspNetUserRoles.

**14. Explain the relationships.**  
A Donor can have multiple Materials. A Receiver can have multiple Requests. A Material can have multiple Requests. User relationships use Restrict delete behavior; Material-to-Request uses Cascade.

**15. Why EF Core?**  
It maps C# models to SQL Server, supports LINQ queries and change tracking, and manages schema changes with migrations.

**16. What is a migration?**  
A migration is a versioned schema change generated from the EF model. The active backend stores migrations in its Migrations folder and applies pending migrations during startup.

## Authentication

**17. How does registration work?**  
The API receives RegisterDto, creates an ApplicationUser through UserManager.CreateAsync and adds the requested role through UserManager.AddToRoleAsync.

**18. How does login work?**  
The API finds the user by email and checks the password with Identity. It rejects invalid credentials and blocked accounts. For a valid user, it creates a signed JWT.

**19. What claims are in the JWT?**  
NameIdentifier, Email and Role. The token expires after three hours.

**20. Authentication versus authorization?**  
Authentication verifies identity. Authorization checks permissions. JWT authentication identifies the user, and role-based attributes restrict endpoints to the required role.

**21. Are Angular guards sufficient security?**  
No. Guards can be bypassed by calling the API directly. Backend JWT validation and authorization attributes are the security boundary.

## Materials and requests

**22. How does image upload work?**  
Angular sends FormData. The API binds it to MaterialDto, saves the optional image under wwwroot/uploads with a GUID-based name, and stores the resulting URL in the Material record.

**23. How do you validate a request quantity?**  
The request endpoint checks that the material exists and is available. It also checks that the requested quantity is at least one and no greater than the material's current quantity.

**24. What happens when a Donor approves a request?**  
The API loads the request and material, checks stock, subtracts the requested quantity and sets IsAvailable to false if stock reaches zero. It then updates the request status and saves.

**25. What happens if a Donor deletes a material with requests?**  
The controller loads related requests and receivers, attempts to email affected receivers, deletes the uploaded image if present and removes the material. The configured material-to-request relationship also cascades deletion.

**26. What statuses are represented?**  
The Request model documents Pending, Approved, Completed and Cancelled. New requests start as Pending. The current approval endpoint updates the status supplied by the Donor and subtracts stock when the status is Approved.

## SignalR

**27. Why SignalR?**  
The intended use is to notify connected clients when a material is posted, so the interface can react without relying only on manual refresh.

**28. Explain the SignalR implementation.**  
The backend maps MaterialHub to /hubs/materials. MaterialNotifierService uses IHubContext to broadcast MaterialPosted. Angular connects through SignalRService and subscribes to that event.

**29. Is the event fully wired?**  
Not yet. The hub, notifier and Angular listener exist, but MaterialsController.Create does not call NotifyMaterialPosted after saving the material. I would wire that call after SaveChangesAsync and add an integration test. That is the accurate current state.

## Admin and supporting features

**30. What can the Admin do?**  
The active AdminController can query users, materials and logs, paginate user/material results, export PDFs, change roles, block/unblock accounts and delete users/materials.

**31. How are PDF reports generated?**  
The API gathers the selected records and uses QuestPDF to create a PDF table. Angular requests the endpoint as a Blob and triggers a browser download.

**32. What is activity logging?**  
ActivityLogService saves the acting user's email, role, action and UTC timestamp. Current material and request controller methods call it for selected create/update/delete operations.

**33. Is all report metadata loaded from the API?**  
No. The reports component currently simulates some display metadata, such as last-generated labels and record counts. The PDF download itself calls the backend export endpoint.

## Challenges and improvements

**34. What was a technical challenge?**  
Keeping material inventory and requests consistent is an important challenge. A request must be validated against current stock, and approval updates both the request status and material quantity.

**35. What would you improve?**  
I would wire the SignalR publisher, align admin UI mutation routes with the backend, add request ownership and status-transition checks, make stock updates concurrency-safe, move credentials out of source control and add integration tests.

**36. How would you prevent simultaneous approvals from overselling?**  
I would make the stock check and decrement an atomic database operation or use a transaction with appropriate concurrency control. A second approval must not rely on an outdated stock value.

**37. How would you test it?**  
Test registration/login and blocked-user behavior, role restrictions, material CRUD and image upload, invalid request quantities, stock changes on approval, admin pagination and PDF export. Integration tests should verify actual HTTP and database behavior.

**38. Why use frontend guards and backend role checks?**  
Guards make navigation role-aware and hide screens that do not apply to the current user. Backend role checks protect data and operations even if someone bypasses the Angular interface.

## If you are unsure of a detail

“I would verify that in the current implementation before claiming it. I can explain the part that is present in the code, and I would treat the remaining part as an improvement rather than saying it is already complete.”
