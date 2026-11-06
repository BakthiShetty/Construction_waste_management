using BackendApi.DTOs;
using BackendApi.Models;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend_API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMailService _mailService;
    private readonly UserManager<ApplicationUser> _userManager;

    public RequestsController(
        ApplicationDbContext context,
        IMailService mailService,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _mailService = mailService;
        _userManager = userManager;
    }

    // POST: /api/requests
    [HttpPost]
    [Authorize(Roles = "Receiver")]
    public async Task<IActionResult> Create([FromBody] CreateRequestDto dto)
    {
        var receiverId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var material = await _context.Materials
            .Include(m => m.Donor)
            .FirstOrDefaultAsync(m => m.Id == dto.MaterialId);

        if (material == null || !material.IsAvailable)
            return NotFound("Material not available");

        if (dto.Quantity < 1 || dto.Quantity > material.Quantity)
            return BadRequest("Invalid quantity");

        var request = new Request
        {
            MaterialId = dto.MaterialId,
            Quantity = dto.Quantity,
            ReceiverId = receiverId!,
            RequestedOn = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();

        // Send mail to donor
        var receiver = await _userManager.FindByIdAsync(receiverId!);
        var donorEmail = material.Donor?.Email;

        if (!string.IsNullOrEmpty(donorEmail))
        {
            var mailRequest = new MailRequest
            {
                ToEmail = donorEmail,
                Subject = $"New Request for \"{material.Name}\"",
                Body = $@"
                    <p><strong>{receiver?.Email}</strong> is requesting 
                    <strong>{dto.Quantity} units </strong> of your material 
                    <em>{material.Name}</em>.</p>
                    <p>Please log in to your dashboard to approve or reject the request.</p>"
            };

            try
            {
                await _mailService.SendEmailAsync(mailRequest);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email: {ex.Message}");
                // Optionally log to a logger
            }
        }

        return Ok(new { message = "Request created and donor notified" });
    }

    // GET: /api/requests/my
    [HttpGet("my")]
    [Authorize(Roles = "Receiver")]
    public async Task<IActionResult> MyRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var requests = await _context.Requests
            .Include(r => r.Material)
            .Where(r => r.ReceiverId == userId)
            .ToListAsync();

        return Ok(requests);
    }

    // GET: /api/requests/material/{materialId}
    [HttpGet("material/{materialId}")]
    [Authorize(Roles = "Donor,Admin")]
    public async Task<IActionResult> GetRequestsForMaterial(int materialId)
    {
        var material = await _context.Materials.FindAsync(materialId);
        if (material == null)
            return NotFound();

        var requests = await _context.Requests
            .Include(r => r.Receiver)
            .Where(r => r.MaterialId == materialId)
            .ToListAsync();

        return Ok(requests);
    }

    // DELETE: /api/requests/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Receiver")]
    public async Task<IActionResult> Delete(int id)
    {
        var request = await _context.Requests.FindAsync(id);
        if (request == null)
            return NotFound();

        _context.Requests.Remove(request);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    //// PATCH: /api/requests/{id}/status?status=Approved
    //[HttpPatch("{id}/status")]
    //[Authorize(Roles = "Donor,Admin")]
    //public async Task<IActionResult> UpdateStatus(int id, [FromQuery] string status)
    //{
    //    var request = await _context.Requests
    //        .Include(r => r.Material)
    //        .FirstOrDefaultAsync(r => r.Id == id);

    //    if (request == null)
    //        return NotFound();

    //    request.Status = status;

    //    if (status == "Completed")
    //    {
    //        var material = await _context.Materials.FindAsync(request.MaterialId);
    //        if (material != null)
    //            material.IsAvailable = false;
    //    }

    //    await _context.SaveChangesAsync();
    //    return Ok(new { message = "Request status updated" });
    //}


    [HttpPut("{id}/status")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> UpdateRequestStatus(int id, [FromBody] UpdateRequestStatusDto dto)
    {
        var request = await _context.Requests
            .Include(r => r.Material)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
            return NotFound("Request not found.");

        if (dto.Status == "Approved")
        {
            if (request.Material == null)
                return BadRequest("Material not found for the request.");

            if (request.Material.Quantity < request.Quantity)
                return BadRequest("Not enough material quantity available.");

            //  Subtract requested quantity from material stock
            request.Material.Quantity -= request.Quantity;

            // ❗ Optionally mark material unavailable if quantity becomes zero
            if (request.Material.Quantity == 0)
            {
                request.Material.IsAvailable = false;
            }
        }

        // Update status
        request.Status = dto.Status;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Request status updated successfully." });
    }
    [HttpGet("mine")]
    [Authorize(Roles = "Donor")]
    public async Task<IActionResult> GetRequestsForMyMaterials()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var requests = await _context.Requests
            .Include(r => r.Material)
            .Include(r => r.Receiver)
            .Where(r => r.Material.DonorId == userId)
            .Select(r => new RequestDto
            {
                Id = r.Id,
                ReceiverEmail = r.Receiver.Email,
                MaterialName = r.Material.Name,
                Quantity = r.Quantity,
                RequestedOn = r.RequestedOn,
                Status = r.Status
            })
            .ToListAsync();

        return Ok(requests);
    }

}
