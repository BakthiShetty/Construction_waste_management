
using BackendApi.Models;

namespace BackendApi.Services.Interfaces;

public interface IRequestService
{
    // Receiver creates a new request for a material
    Task<Request?> CreateAsync(int materialId, int quantity, string receiverId);

    // Get all requests for a specific receiver
    Task<IEnumerable<Request>> GetRequestsByReceiverAsync(string receiverId);

    // Donor/Admin gets all requests for a specific material
    Task<IEnumerable<Request>> GetRequestsForMaterialAsync(int materialId);

    // Donor/Admin updates the request status (Approved, Completed, Cancelled)
    Task<bool> UpdateRequestStatusAsync(int requestId, string status);
}
