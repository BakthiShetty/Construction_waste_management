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
    private readonly IWebHostEnvironment _env;    // for wwwroot path
    private readonly IMailService _emailService;

    public MaterialsController(ApplicationDbContext context, IWebHostEnvironment env, IMailService emailService)
    {
        _context = context;
        _env = env;
        _emailService = emailService;
    }

    /*──────────────────────────────────────────────
     * 1. Everyone – list all available materials
     *─────────────────────────────────────────────*/
    [HttpGet]
    public async Task<IActionResult> GetAll()
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
            })
            .ToListAsync();

        return Ok(items);
    }


    /*──────────────────────────────────────────────
     * 2. Donor – list only his own materials
     *─────────────────────────────────────────────*/
    [HttpGet("mine")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> GetMyMaterials()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var items = await _context.Materials
                                   .Where(m => m.DonorId == userId)
                                   .OrderByDescending(m => m.PostedDate)
                                   .ToListAsync();
        return Ok(items);
    }

    /*──────────────────────────────────────────────
     * 3. Get single material by id
     *─────────────────────────────────────────────*/
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _context.Materials.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    /*──────────────────────────────────────────────
     * 4. Donor – create material (multipart/form)
     *─────────────────────────────────────────────*/
    [HttpPost]
    [Authorize(Roles = "Donor")]
    [RequestSizeLimit(10_000_000)]                       // ≈ 10 MB
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
            Price = dto.Price,                     // ✅
            Location = dto.Location,
            ImageUrl = imageUrl,
            PostedDate = DateTime.UtcNow,
            IsAvailable = true,
            DonorId = donorId!
        };

        _context.Materials.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Material posted successfully", entity.Id });
    }

    /*──────────────────────────────────────────────
     * 5. Donor – update material (can replace image)
     *─────────────────────────────────────────────*/
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Donor")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Update(int id, [FromForm] MaterialDto dto)
    {
        var donorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var entity = await _context.Materials.FindAsync(id);

        if (entity is null || entity.DonorId != donorId)
            return Unauthorized();

        entity.Name = dto.Name;
        entity.Type = dto.Type;
        entity.Description = dto.Description;
        entity.Quantity = dto.Quantity;
        entity.Price = dto.Price;                 // ✅
        entity.Location = dto.Location;

        if (dto.Image is { Length: > 0 })
        {
            // Optionally delete old file
            if (!string.IsNullOrWhiteSpace(entity.ImageUrl))
            {
                var oldPath = Path.Combine(_env.WebRootPath, entity.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }
            entity.ImageUrl = await SaveImageAsync(dto.Image);
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Material updated successfully" });
    }

    /*──────────────────────────────────────────────
     * 6. Donor – delete material
     *─────────────────────────────────────────────*/
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> Delete(int id)
    {
        var donorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var entity = await _context.Materials.FindAsync(id);

        if (entity is null || entity.DonorId != donorId)
            return Unauthorized();

        foreach (var request in entity.Requests)
        {
            var email = request.Receiver.Email;
            var mailRequest = new MailRequest
            {
                ToEmail = email,
                Subject = "Material Deletion Notification",
                Name = "ReConX Platform",
                Email = "noreply@reconx.com",
                Body = $"Dear {email},\n\nWe regret to inform you that the material '{entity.Name}' you requested has been deleted by the donor due to unavailability of stock.\n\nRegards,\nReConX Team"
            };

            await _emailService.SendEmailAsync(mailRequest);
        }

        // (optional) delete image file
        if (!string.IsNullOrWhiteSpace(entity.ImageUrl))
        {
            var path = Path.Combine(_env.WebRootPath, entity.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        _context.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Material deleted successfully" });
    }

    /*──────────────────────────────────────────────
     * Helper: save uploaded image and return URL
     *─────────────────────────────────────────────*/
    private async Task<string?> SaveImageAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0) return null;

        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var savePath = Path.Combine(uploadsDir, fileName);
        await using var stream = System.IO.File.Create(savePath);
        await file.CopyToAsync(stream);

        // Return full absolute URL
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return $"{baseUrl}/uploads/{fileName}";
    }

}
