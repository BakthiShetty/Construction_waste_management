using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMailService _mailService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IActivityLogService _logService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public RequestsController(
        ApplicationDbContext context,
        IMailService mailService,
        UserManager<ApplicationUser> userManager,
        IActivityLogService logService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _mailService = mailService;
        _userManager = userManager;
        _logService = logService;
        _httpContextAccessor = httpContextAccessor;
    }

    private async Task Log(string action)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var email = user?.FindFirst(ClaimTypes.Email)?.Value;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;

        if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(role))
            await _logService.LogActivityAsync(email, role, action);
    }

    // POST /api/requests
    [HttpPost]
    [Authorize(Roles = "Receiver")]
    public async Task<IActionResult> Create([FromBody] CreateRequestDto dto)
    {
        var receiverId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var material = await _context.Materials.Include(m => m.Donor).FirstOrDefaultAsync(m => m.Id == dto.MaterialId);

        if (material == null || !material.IsAvailable)
            return NotFound("Material not available");

        if (dto.Quantity < 1 || dto.Quantity > material.Quantity)
            return BadRequest("Invalid quantity");

        var request = new Request
        {
            MaterialId = dto.MaterialId,
            Quantity = dto.Quantity,
            ReceiverId = receiverId!,
            RequestedOn = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();
        await Log($"Created request for '{material.Name}' with quantity {dto.Quantity}");

        // Send notification
        var receiver = await _userManager.FindByIdAsync(receiverId!);
        if (!string.IsNullOrEmpty(material.Donor?.Email))
        {
            var mailRequest = new MailRequest
            {
                ToEmail = material.Donor.Email,
                Subject = $"New Request for \"{material.Name}\"",
                Body = $"<p><strong>{receiver?.Email}</strong> requested <strong>{dto.Quantity}</strong> units of <em>{material.Name}</em>.</p>"
            };
            try { await _mailService.SendEmailAsync(mailRequest); } catch { }
        }

        return Ok(new { message = "Request created and donor notified" });
    }

    // GET /api/requests?type=my
    // GET /api/requests?type=material&id=5
    // GET /api/requests?type=mine
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> Get([FromQuery] string type, [FromQuery] int? id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        switch (type)
        {
            case "my" when User.IsInRole("Receiver"):
                var myRequests = await _context.Requests
                    .Include(r => r.Material)
                    .Where(r => r.ReceiverId == userId)
                    .ToListAsync();
                return Ok(myRequests);

            case "material" when User.IsInRole("Donor") || User.IsInRole("Admin"):
                if (id == null) return BadRequest("Material ID required");
                var material = await _context.Materials.FindAsync(id);
                if (material == null) return NotFound("Material not found");
                var materialRequests = await _context.Requests
                    .Include(r => r.Receiver)
                    .Where(r => r.MaterialId == id)
                    .ToListAsync();
                return Ok(materialRequests);

            case "mine" when User.IsInRole("Donor"):
                var myMaterialRequests = await _context.Requests
                    .Include(r => r.Material)
                    .Include(r => r.Receiver)
                    .Where(r => r.Material.DonorId == userId)
                    .Select(r => new RequestDto
                    {
                        Id = r.Id,
                        ReceiverEmail = r.Receiver.Email,
                        MaterialName = r.Material.Name,
                        Quantity = r.Quantity,
                        RequestedOn = r.RequestedOn,
                        Status = r.Status
                    }).ToListAsync();
                return Ok(myMaterialRequests);

            default:
                return BadRequest("Invalid or unauthorized request type.");
        }
    }

    // PUT /api/requests?id=5
    [HttpPut]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> UpdateStatus([FromQuery] int id, [FromBody] UpdateRequestStatusDto dto)
    {
        var request = await _context.Requests.Include(r => r.Material).FirstOrDefaultAsync(r => r.Id == id);
        if (request == null)
            return NotFound("Request not found.");

        if (dto.Status == "Approved")
        {
            if (request.Material == null || request.Material.Quantity < request.Quantity)
                return BadRequest("Insufficient quantity.");

            request.Material!.Quantity -= request.Quantity;
            if (request.Material.Quantity == 0)
                request.Material.IsAvailable = false;
        }

        request.Status = dto.Status;
        await _context.SaveChangesAsync();
        await Log($"Updated request ID {id} to '{dto.Status}'");

        return Ok(new { message = "Request status updated" });
    }

    // DELETE /api/requests?id=5
    [HttpDelete]
    [Authorize(Roles = "Receiver")]
    public async Task<IActionResult> Delete([FromQuery] int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound();

        _context.Requests.Remove(request);
        await _context.SaveChangesAsync();
        await Log($"Deleted request ID {id}");

        return NoContent();
    }
}
