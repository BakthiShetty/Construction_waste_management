using BackendApi.DTOs;

namespace BackendApi.Services.Interfaces
{
    public interface IMailService
    {
        Task SendEmailAsync(MailRequest mailRequest);
    }

}
