
using BackendApi.DTOs;

namespace BackendApi.Services.Interfaces;

public interface IAuthService
{
    // Register a new user (Donor/Receiver)
    Task<(bool Succeeded, IEnumerable<string> Errors)> RegisterAsync(RegisterDto dto);

    // Login and generate JWT token
    Task<(string? Token, string? Role, string? Error)> LoginAsync(LoginDto dto);

    // Get currently logged-in user profile
    Task<ApplicationUser?> GetCurrentUserAsync(string userId);
}
