namespace BackendApi.Models
{
    public class Request
    {
        public int Id { get; set; }
        public string ReceiverId { get; set; }
        public ApplicationUser Receiver { get; set; }

        public int MaterialId { get; set; }
        public Material Material { get; set; }
        public int Quantity { get; set; }

        public DateTime RequestedOn { get; set; }
        public string Status { get; set; } // Pending, Approved, Completed, Cancelled
    }
}
