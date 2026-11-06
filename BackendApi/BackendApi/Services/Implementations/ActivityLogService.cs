using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BackendApi.Services.Implementations
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(string email, string role, string action)
        {
            var log = new ActivityLog
            {
                UserEmail = email,
                Role = role,
                Action = action,
                Timestamp = DateTime.UtcNow
            };
            _context.ActivityLogs.Add(log);
            await _context.SaveChangesAsync();
        }

        public async Task<List<ActivityLogDto>> GetAllLogsAsync()
        {
            return await _context.ActivityLogs
                .OrderByDescending(l => l.Timestamp)
                .Select(l => new ActivityLogDto
                {
                    Email = l.UserEmail,
                    Role = l.Role,
                    Action = l.Action,
                    Timestamp = l.Timestamp
                }).ToListAsync();
        }
    }


}
