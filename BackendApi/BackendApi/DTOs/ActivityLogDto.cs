namespace BackendApi.DTOs
{
    public class ActivityLogDto
    {
        public string Email { get; set; }
        public string Role { get; set; }
        public string Action { get; set; }
        public DateTime Timestamp { get; set; }
    }

}
