using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services.Implementations;

public class AdminService : IAdminService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    public async Task<IEnumerable<ApplicationUser>> GetAllUsersAsync()
    {
        return await _userManager.Users.ToListAsync();
    }

    public async Task<bool> DeleteUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return false;

        var userRequests = _context.Requests.Where(r => r.ReceiverId == userId);
        _context.Requests.RemoveRange(userRequests);

        var userMaterials = _context.Materials.Where(m => m.DonorId == userId);
        _context.Materials.RemoveRange(userMaterials);

        await _userManager.DeleteAsync(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<Material>> GetAllMaterialsAsync()
    {
        return await _context.Materials
            .Include(m => m.Donor)
            .ToListAsync();
    }

    public async Task<bool> DeleteMaterialAsync(int materialId)
    {
        var material = await _context.Materials.FindAsync(materialId);
        if (material == null)
            return false;

        var relatedRequests = _context.Requests.Where(r => r.MaterialId == materialId);
        _context.Requests.RemoveRange(relatedRequests);

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();

        return true;
    }
}
