namespace BackendApi.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }
        public string UserEmail { get; set; }
        public string Role { get; set; }
        public string Action { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

}
