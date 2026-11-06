using BackendApi.DTOs;
using BackendApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BackendApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IMailService _mailService;

        public ContactController(IMailService mailService)
        {
            _mailService = mailService;
        }

        [HttpPost]
        public async Task<IActionResult> Send([FromBody] MailRequest request)
        {
            request.ToEmail = "bakthishetty31@gmail.com"; // Or your admin email
            await _mailService.SendEmailAsync(request);
            return Ok(new { message = "Message sent successfully!" });
        }
    }

}
