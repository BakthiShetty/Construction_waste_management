using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BackendApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IMailService _emailService;
    private readonly IActivityLogService _logService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public MaterialsController(ApplicationDbContext context, IWebHostEnvironment env, IMailService emailService, IActivityLogService logService, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _env = env;
        _emailService = emailService;
        _logService = logService;
        _httpContextAccessor = httpContextAccessor;
    }

    private async Task Log(string action)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var email = user?.FindFirst(ClaimTypes.Email)?.Value;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;

        if (email != null && role != null)
        {
            await _logService.LogActivityAsync(email, role, action);
        }
    }

    // ───────────────────────────────────────────────
    // GET (Unified for: all, mine, single)
    // ───────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string type, [FromQuery] int? id = null)
    {
        if (type == "all")
        {
            var items = await _context.Materials
                .Where(m => m.IsAvailable)
                .OrderByDescending(m => m.PostedDate)
                .Include(m => m.Donor)
                .Select(m => new MaterialResponseDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    Type = m.Type,
                    Description = m.Description,
                    Quantity = m.Quantity,
                    Location = m.Location,
                    Price = m.Price,
                    ImageUrl = m.ImageUrl,
                    PostedDate = m.PostedDate,
                    DonorId = m.DonorId,
                    Donor = m.Donor == null ? null : new DonorDto
                    {
                        Email = m.Donor.Email,
                        UserName = m.Donor.UserName
                    }
                }).ToListAsync();

            return Ok(items);
        }

        if (type == "mine")
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var items = await _context.Materials
                .Where(m => m.DonorId == userId)
                .OrderByDescending(m => m.PostedDate)
                .ToListAsync();

            return Ok(items);
        }

        if (type == "single" && id.HasValue)
        {
            var item = await _context.Materials.FindAsync(id.Value);
            return item is null ? NotFound() : Ok(item);
        }

        return BadRequest("Invalid query parameters.");
    }

    // ───────────────────────────────────────────────
    // POST – Donor create material
    // ───────────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Donor")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Create([FromForm] MaterialDto dto)
    {
        var donorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var imageUrl = await SaveImageAsync(dto.Image);

        var entity = new Material
        {
            Name = dto.Name,
            Type = dto.Type,
            Description = dto.Description,
            Quantity = dto.Quantity,
            Price = dto.Price,
            Location = dto.Location,
            ImageUrl = imageUrl,
            PostedDate = DateTime.UtcNow,
            IsAvailable = true,
            DonorId = donorId!
        };

        _context.Materials.Add(entity);
        await _context.SaveChangesAsync();
        await Log($"Added a new material: {entity.Name}");

        return Ok(new { message = "Material posted successfully", entity.Id });
    }

    // ───────────────────────────────────────────────
    // PUT – Donor update material
    // ───────────────────────────────────────────────
    [HttpPut]
    [Authorize(Roles = "Donor")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Update([FromQuery] int id, [FromForm] MaterialDto dto)
    {
        var donorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var entity = await _context.Materials.FindAsync(id);

        if (entity is null || entity.DonorId != donorId)
            return Unauthorized();

        entity.Name = dto.Name;
        entity.Type = dto.Type;
        entity.Description = dto.Description;
        entity.Quantity = dto.Quantity;
        entity.Price = dto.Price;
        entity.Location = dto.Location;

        if (dto.Image is { Length: > 0 })
        {
            if (!string.IsNullOrWhiteSpace(entity.ImageUrl))
            {
                var oldPath = Path.Combine(_env.WebRootPath, entity.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            entity.ImageUrl = await SaveImageAsync(dto.Image);
        }

        await _context.SaveChangesAsync();
        await Log($"Updated material (ID: {id})");

        return Ok(new { message = "Material updated successfully" });
    }

    // ───────────────────────────────────────────────
    // DELETE – Donor delete material
    // ───────────────────────────────────────────────
    [HttpDelete]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> Delete([FromQuery] int id)
    {
        var donorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var entity = await _context.Materials
            .Include(m => m.Requests)
            .ThenInclude(r => r.Receiver)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity is null || entity.DonorId != donorId)
            return Unauthorized();

        foreach (var request in entity.Requests)
        {
            var email = request.Receiver.Email;
            await _emailService.SendEmailAsync(new MailRequest
            {
                ToEmail = email,
                Subject = "Material Deletion Notification",
                Name = "ReConX Platform",
                Email = "noreply@reconx.com",
                Body = $"Dear {email},\n\nThe material '{entity.Name}' has been deleted by the donor.\n\nRegards,\nReConX Team"
            });
        }

        if (!string.IsNullOrWhiteSpace(entity.ImageUrl))
        {
            var path = Path.Combine(_env.WebRootPath, entity.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        _context.Remove(entity);
        await _context.SaveChangesAsync();
        await Log($"Deleted material: {entity.Name}");

        return Ok(new { message = "Material deleted successfully" });
    }

    // ───────────────────────────────────────────────
    // Helper: Save uploaded image
    // ───────────────────────────────────────────────
    private async Task<string?> SaveImageAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0) return null;

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var savePath = Path.Combine(uploadsDir, fileName);
        await using var stream = System.IO.File.Create(savePath);
        await file.CopyToAsync(stream);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return $"{baseUrl}/uploads/{fileName}";
    }
}
