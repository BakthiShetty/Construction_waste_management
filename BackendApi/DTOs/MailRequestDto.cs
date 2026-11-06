namespace BackendApi.DTOs
{
    public class MailRequest
    {
        public string Name { get; set; }
        public string Subject { get; set; }
        public string ToEmail { get; set; } // Admin email
        public string Email { get; set; }
        public string Body { get; set; }
    }

}
