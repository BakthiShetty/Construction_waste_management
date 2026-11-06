
using BackendApi.DTOs;
using BackendApi.Models;


namespace BackendApi.Services.Interfaces
{
    public interface IMaterialService
    {
        // Get all available materials
        Task<IEnumerable<Material>> GetAllAsync();

        // Get a material by ID
        Task<Material?> GetByIdAsync(int id);

        // Donor creates a new material
        Task<Material> CreateAsync(MaterialDto dto, string donorId);

        // Donor updates an existing material
        Task<bool> UpdateAsync(int id, MaterialDto dto, string donorId);

        // Donor deletes a material
        Task<bool> DeleteAsync(int id, string donorId);
    }
}