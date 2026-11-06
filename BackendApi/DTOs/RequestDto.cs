namespace BackendApi.DTOs
{
    public class RequestDto
    {
        public int Id { get; set; }
        public int MaterialId { get; set; }
        public string? ReceiverEmail { get; set; }
        public required string MaterialName { get; set; }
        public int Quantity { get; set; }
        public DateTime RequestedOn { get; set; }
        public string? Status { get; set; }
    }
}
