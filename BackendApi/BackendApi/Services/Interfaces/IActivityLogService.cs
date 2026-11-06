using BackendApi.DTOs;
using BackendApi.Models;

namespace BackendApi.Services.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActivityAsync(string email, string role, string action);
        Task<List<ActivityLogDto>> GetAllLogsAsync();
    }


}
