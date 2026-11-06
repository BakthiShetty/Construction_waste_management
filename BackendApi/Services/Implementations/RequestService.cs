
namespace BackendApi.Services.Interfaces;
using BackendApi.Models;
using Microsoft.EntityFrameworkCore;



public class RequestService : IRequestService
{
    private readonly ApplicationDbContext _context;

    public RequestService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Request?> CreateAsync(int materialId, int quantity, string receiverId)

    {
        var material = await _context.Materials.FindAsync(materialId);
        if (material == null || !material.IsAvailable)
            return null;

        var request = new Request
        {
            MaterialId = materialId,
            Quantity = quantity,
            ReceiverId = receiverId,
            RequestedOn = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();

        return request;
    }


    public async Task<IEnumerable<Request>> GetRequestsByReceiverAsync(string receiverId)
    {
        return await _context.Requests
            .Include(r => r.Material)
            .Where(r => r.ReceiverId == receiverId)
            .OrderByDescending(r => r.RequestedOn)
            .ToListAsync();
    }

    public async Task<IEnumerable<Request>> GetRequestsForMaterialAsync(int materialId)
    {
        return await _context.Requests
            .Include(r => r.Receiver)
            .Where(r => r.MaterialId == materialId)
            .OrderByDescending(r => r.RequestedOn)
            .ToListAsync();
    }

    public async Task<bool> UpdateRequestStatusAsync(int requestId, string status)
    {
        var request = await _context.Requests
            .Include(r => r.Material)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null)
            return false;

        request.Status = status;

        if (status == "Completed")
        {
            var material = request.Material;
            if (material != null)
                material.IsAvailable = false;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
