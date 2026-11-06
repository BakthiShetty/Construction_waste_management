using BackendApi.Models;

namespace BackendApi.Services.Interfaces;

public interface IAdminService
{
    // Get list of all users
    Task<IEnumerable<ApplicationUser>> GetAllUsersAsync();

    // Delete a user and their related data
    Task<bool> DeleteUserAsync(string userId);

    // Get all material listings
    Task<IEnumerable<Material>> GetAllMaterialsAsync();

    // Delete a material and related requests
    Task<bool> DeleteMaterialAsync(int materialId);
}
