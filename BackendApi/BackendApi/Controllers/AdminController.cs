using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using iTextSharp.text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;



namespace Backend_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMailService _mailService;
    private readonly IActivityLogService _logService;

    public AdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IMailService mailService,
        IActivityLogService logService)
    {
        _context = context;
        _userManager = userManager;
        _mailService = mailService;
        _logService = logService;
    }

    // ✅ GET: /api/admin?type=logs|users|materials&export=true
    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] string type,
        [FromQuery] bool paginated = false,
        int pageNumber = 1,
        int pageSize = 5,
        [FromQuery] bool export = false)
    {
        switch (type.ToLower())
        {
            case "logs":
                var logs = await _logService.GetAllLogsAsync();

                if (export)
                {
                    var istTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");

                    var exportData = logs.Select(log => new
                    {
                        log.Email,
                        log.Role,
                        log.Action,
                        Timestamp = TimeZoneInfo.ConvertTimeFromUtc(log.Timestamp, istTimeZone)
                            .ToString("yyyy-MM-dd HH:mm:ss")
                    }).Cast<object>().ToList();


                    var pdfBytes = GeneratePdf("ACTIVITY LOGS", exportData);
                    return File(pdfBytes, "application/pdf", "logs.pdf");
                }

                return Ok(logs);

            case "users":
                var userQuery = _userManager.Users.Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.Email,
                    u.Role,
                    u.IsBlocked
                });

                if (export)
                {
                    var exportData = await userQuery.Cast<object>().ToListAsync();
                    var pdfBytes = GeneratePdf("USERS LIST", exportData);
                    return File(pdfBytes, "application/pdf", "users.pdf");
                }

                if (paginated)
                {
                    var total = await userQuery.CountAsync();
                    var users = await userQuery.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
                    return Ok(new { data = users, totalCount = total });
                }

                return Ok(await userQuery.ToListAsync());

            case "materials":
                var materialQuery = _context.Materials
                    .Include(m => m.Donor)
                    .Select(m => new
                    {
                        m.Id,
                        m.Name,
                        m.Type,
                        m.Quantity,
                        m.Price,
                        m.Location,
                        m.IsAvailable,
                        DonorName = m.Donor.UserName,
                        DonorEmail = m.Donor.Email
                    });

                if (export)
                {
                    var exportData = await materialQuery.Cast<object>().ToListAsync();
                    var pdfBytes = GeneratePdf("MATERIALS LIST", exportData);
                    return File(pdfBytes, "application/pdf", "materials.pdf");
                }

                if (paginated)
                {
                    var total = await materialQuery.CountAsync();
                    var materials = await materialQuery.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
                    return Ok(new { data = materials, totalCount = total });
                }

                return Ok(await materialQuery.ToListAsync());

            default:
                return BadRequest("Invalid 'type' parameter.");
        }
    }

    [HttpPatch]
    public async Task<IActionResult> Patch([FromQuery] string id, [FromQuery] string action, [FromBody] object payload)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound("User not found.");

        switch (action.ToLower())
        {
            case "role":
                var newRole = payload?.ToString();
                var oldRole = user.Role;
                user.Role = newRole;
                await _userManager.UpdateAsync(user);

                await _mailService.SendEmailAsync(new MailRequest
                {
                    ToEmail = user.Email,
                    Subject = "Role Changed Notification",
                    Body = $"Your account role changed from '{oldRole}' to '{newRole}'."
                });

                return Ok(new { message = "User role updated successfully" });

            case "block":
                if (bool.TryParse(payload?.ToString(), out bool isBlocked))
                {
                    user.IsBlocked = isBlocked;
                    await _userManager.UpdateAsync(user);

                    await _mailService.SendEmailAsync(new MailRequest
                    {
                        ToEmail = user.Email,
                        Subject = isBlocked ? "Account Blocked" : "Account Unblocked",
                        Body = isBlocked
                            ? "Your account has been blocked by admin. Contact support."
                            : "Your account has been unblocked. You can now access the system."
                    });

                    return Ok(new { message = $"User has been {(isBlocked ? "blocked" : "unblocked")}" });
                }
                return BadRequest("Invalid block value.");

            default:
                return BadRequest("Invalid 'action' parameter.");
        }
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string id, [FromQuery] string type)
    {
        switch (type.ToLower())
        {
            case "user":
                var user = await _userManager.FindByIdAsync(id);
                if (user == null) return NotFound();

                var userRequests = _context.Requests.Where(r => r.ReceiverId == id);
                _context.Requests.RemoveRange(userRequests);

                var userMaterials = _context.Materials.Where(m => m.DonorId == id);
                _context.Materials.RemoveRange(userMaterials);

                await _userManager.DeleteAsync(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User and related data deleted" });

            case "material":
                if (!int.TryParse(id, out int materialId)) return BadRequest("Invalid material ID.");
                var material = await _context.Materials.FindAsync(materialId);
                if (material == null) return NotFound();

                var materialRequests = _context.Requests.Where(r => r.MaterialId == materialId);
                _context.Requests.RemoveRange(materialRequests);

                _context.Materials.Remove(material);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Material and related requests deleted" });

            default:
                return BadRequest("Invalid 'type' parameter.");
        }
    }

    // ✅ PDF Generator using QuestPDF
    private byte[] GeneratePdf(string title, List<object> data)
    {

        return QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                // Header with logo and title
                page.Header().Height(80).Padding(15).Row(row =>
                {

                    row.RelativeItem().AlignCenter().AlignMiddle().Text(title)
                        .FontSize(20).Bold().FontColor(Colors.Black);

                    row.ConstantItem(100).AlignRight().AlignMiddle().Text($"Records: {data.Count}")
                        .FontSize(12).FontColor(Colors.Black);
                });

                // Content table
                page.Content().PaddingVertical(20).Table(table =>
                {
                    var props = data.FirstOrDefault()?.GetType().GetProperties();
                    if (props == null) return;

                    // Columns
                    table.ColumnsDefinition(columns =>
                    {
                        foreach (var _ in props) columns.RelativeColumn();
                    });

                    // Header
                    table.Header(header =>
                    {
                        foreach (var prop in props)
                        {
                            header.Cell().Background(Colors.Blue.Darken1).Padding(8)
                                .Text(prop.Name).FontSize(12).Bold().FontColor(Colors.White);
                        }
                    });

                    // Rows
                    for (int i = 0; i < data.Count; i++)
                    {
                        var row = data[i];
                        var bgColor = i % 2 == 0 ? Colors.White : Colors.Blue.Lighten5;

                        foreach (var prop in props)
                        {
                            var value = prop.GetValue(row)?.ToString() ?? "";
                            table.Cell().Background(bgColor).Padding(8).Text(value).FontSize(10);
                        }
                    }
                });

                // Footer
                page.Footer().AlignCenter().Text($"© 2025 ReConX - Generated: {DateTime.Now:yyyy-MM-dd HH:mm}")
                    .FontSize(10).FontColor(Colors.Grey.Darken1);
            });
        }).GeneratePdf();
    }

    }
