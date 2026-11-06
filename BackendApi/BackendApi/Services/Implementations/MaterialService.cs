using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services.Implementations;

public class MaterialService : IMaterialService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _env;

    public MaterialService(ApplicationDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    /*─────────────────────────────*/
    public async Task<IEnumerable<Material>> GetAllAsync()
        => await _context.Materials
                         .Include(m => m.Donor)
                         .Where(m => m.IsAvailable)
                         .OrderByDescending(m => m.PostedDate)
                         .ToListAsync();

    /*─────────────────────────────*/
    public async Task<Material?> GetByIdAsync(int id)
        => await _context.Materials
                         .Include(m => m.Donor)
                         .FirstOrDefaultAsync(m => m.Id == id);

    /*─────────────────────────────*/
    public async Task<Material> CreateAsync(MaterialDto dto, string donorId)
    {
        var imageUrl = await SaveImageAsync(dto.Image);

        var material = new Material
        {
            Name = dto.Name,
            Type = dto.Type,
            Description = dto.Description,
            Quantity = dto.Quantity,
            Location = dto.Location,
            Price = dto.Price,      // ✅ new
            ImageUrl = imageUrl,
            DonorId = donorId,
            IsAvailable = true,
            PostedDate = DateTime.UtcNow
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();
        return material;
    }

    /*─────────────────────────────*/
    public async Task<bool> UpdateAsync(int id, MaterialDto dto, string donorId)
    {
        var material = await _context.Materials
                                     .FirstOrDefaultAsync(m => m.Id == id && m.DonorId == donorId);
        if (material is null) return false;

        material.Name = dto.Name;
        material.Type = dto.Type;
        material.Description = dto.Description;
        material.Quantity = dto.Quantity;
        material.Location = dto.Location;
        material.Price = dto.Price;

        if (dto.Image is { Length: > 0 })
        {
            // delete old
            if (!string.IsNullOrWhiteSpace(material.ImageUrl))
            {
                var oldPath = Path.Combine(_env.WebRootPath, material.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }
            material.ImageUrl = await SaveImageAsync(dto.Image);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    /*─────────────────────────────*/
    public async Task<bool> DeleteAsync(int id, string donorId)
    {
        var material = await _context.Materials
                                     .FirstOrDefaultAsync(m => m.Id == id && m.DonorId == donorId);
        if (material is null) return false;

        // cascade delete image
        if (!string.IsNullOrWhiteSpace(material.ImageUrl))
        {
            var path = Path.Combine(_env.WebRootPath, material.ImageUrl.TrimStart('/'));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }

        // optionally delete related requests
        var reqs = _context.Requests.Where(r => r.MaterialId == id);
        _context.Requests.RemoveRange(reqs);

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
        return true;
    }

    /*─────────────────────────────*/
    private async Task<string?> SaveImageAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0) return null;

        var uploads = Path.Combine(_env.WebRootPath, "uploads");
        if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        await using var stream = System.IO.File.Create(Path.Combine(uploads, fileName));
        await file.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }
}
