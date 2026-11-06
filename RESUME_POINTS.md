# Resume-Ready Project Description

## ReConX – Construction Waste Exchange Platform

**Tech Stack:** Angular 20, TypeScript, Angular Material, C#, ASP.NET Core Web API (.NET 8), Entity Framework Core, SQL Server, ASP.NET Core Identity, JWT, SignalR, Docker.

- Developed a role-based construction-material exchange platform connecting Donors and Receivers, with an Admin interface for managing users, listings and activity records.
- Implemented material listing workflows with quantity, price, location, description and image upload using Angular forms and ASP.NET Core multipart endpoints.
- Built request-management APIs with quantity validation and inventory updates when Donors approve requests.
- Integrated ASP.NET Core Identity and JWT authentication with role-based authorization for Donor, Receiver and Admin operations.
- Used Entity Framework Core and SQL Server to persist users, materials, requests and activity logs, with entity relationships and migrations.
- Implemented SMTP email notifications for selected request, material-deletion and account-administration events, and admin PDF report generation using QuestPDF.

## Short version

**ReConX – Construction Waste Exchange Platform** | Angular, .NET 8, C#, SQL Server, EF Core, JWT

Built a role-based platform for listing and requesting reusable construction materials. Implemented material CRUD with image upload, quantity-based requests and stock updates, JWT authentication with Donor/Receiver/Admin authorization, SQL Server persistence, activity logging, email notifications and admin PDF exports.

## Accuracy checks before using

- Describe SignalR as a configured real-time notification foundation unless the material creation controller is wired to publish MaterialPosted.
- The reports page simulates some display metadata; the backend PDF export endpoint is implemented.
- Verify admin UI mutation routes end to end before claiming role/block/delete buttons are fully integrated.
- Keep only the bullets that reflect your own contribution and that you can explain and demonstrate.
