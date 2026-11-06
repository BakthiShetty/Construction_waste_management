
using BackendApi.DTOs;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMailService _mailService;

    public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager,
        IMailService mailService)
    {
        _context = context;
        _userManager = userManager;
        _mailService = mailService;
    }

    //  GET: /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userManager.Users
            .Select(u => new
            {
                u.Id,
                u.UserName,
                u.Email,
                u.Role,
                u.IsBlocked
            }).ToListAsync();

        return Ok(users);
    }

    //  DELETE: /api/admin/user/{id}
    [HttpDelete("user/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        var userRequests = _context.Requests.Where(r => r.ReceiverId == id);
        _context.Requests.RemoveRange(userRequests);

        var userMaterials = _context.Materials.Where(m => m.DonorId == id);
        _context.Materials.RemoveRange(userMaterials);

        await _userManager.DeleteAsync(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User and related data deleted" });
    }

    //  GET: /api/admin/materials
    [HttpGet("materials")]
    public async Task<IActionResult> GetAllMaterials()
    {
        var materials = await _context.Materials
            .Include(m => m.Donor)
            .Select(m => new
            {
                m.Id,
                m.Name,
                m.Type,
                m.Quantity,
                m.Location,
                m.IsAvailable,
                DonorEmail = m.Donor.Email
            }).ToListAsync();

        return Ok(materials);
    }

    //  DELETE: /api/admin/material/{id}
    [HttpDelete("material/{id}")]
    public async Task<IActionResult> DeleteMaterial(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null)
            return NotFound();

        var requests = _context.Requests.Where(r => r.MaterialId == id);
        _context.Requests.RemoveRange(requests);

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Material and related requests deleted" });
    }

    [HttpPatch("user/{id}/role")]
    public async Task<IActionResult> UpdateUserRole(string id, [FromBody] string newRole)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        var oldRole = user.Role;
        user.Role = newRole;
        await _userManager.UpdateAsync(user);

        // Send email notification
        string subject = "Role Changed Notification";
        string body = $"Dear user,\n\nYour account role has been changed from '{oldRole}' to '{newRole}' by the administrator.\nIf you have any questions, please contact support.";

        await _mailService.SendEmailAsync(new MailRequest
        {
            ToEmail = user.Email,
            Subject = subject,
            Body = body
        });

        return Ok(new { message = "User role updated successfully" });
    }


    [HttpPatch("user/{id}/block")]
    public async Task<IActionResult> SetUserBlockStatus(string id, [FromBody] bool isBlocked)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound();

        user.IsBlocked = isBlocked;
        await _userManager.UpdateAsync(user);

        // Send email notification
        string subject = isBlocked ? "Account Blocked" : "Account Unblocked";
        string body = isBlocked
            ? "Dear user,\n\nYour account has been blocked by the admin due to policy violations or suspicious activity. Please contact support for further assistance."
            : "Dear user,\n\nYour account has been unblocked and access has been restored. You may now log in and continue using the service.";

        await _mailService.SendEmailAsync(new MailRequest
        {
            ToEmail = user.Email,
            Subject = subject,
            Body = body
        });

        return Ok(new { message = $"User has been {(isBlocked ? "blocked" : "unblocked")}" });
    }



}
