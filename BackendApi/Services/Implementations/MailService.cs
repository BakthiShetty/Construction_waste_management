namespace BackendApi.Services.Implementations
{
    using BackendApi.DTOs;
    using BackendApi.Services.Interfaces;
    using Microsoft.Extensions.Options;
    using System.Net;
    using System.Net.Mail;

    public class MailService : IMailService
    {
        private readonly IConfiguration _config;

        public MailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(MailRequest request)
        {
            var mailSettings = _config.GetSection("MailSettings");

            var email = new MailMessage
            {
                From = new MailAddress(mailSettings["Mail"], mailSettings["DisplayName"]),
                Subject = $"Contact Message from {request.Name}: {request.Subject}",
                Body = $@"
                        Hello, I’m {request.Name} ({request.Email}),

                        {request.Body}

                        Thank you,
                        {request.Name}
                        ",
                IsBodyHtml = false
            };

            email.To.Add(request.ToEmail);

            using var smtp = new SmtpClient(mailSettings["Host"], int.Parse(mailSettings["Port"]!))
            {
                Credentials = new NetworkCredential(mailSettings["Mail"], mailSettings["Password"]),
                EnableSsl = true
            };

            await smtp.SendMailAsync(email);
        }
    }


}
