namespace BackendApi.Models
{
    public class Material
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }  // Brick, Tile, etc.
        public string Description { get; set; }
        public int Quantity { get; set; }
        public string ImageUrl { get; set; }
        public string Location { get; set; }
        public DateTime PostedDate { get; set; }
        public bool IsAvailable { get; set; } = true;

        public string DonorId { get; set; }
        public decimal Price { get; set; }
        public ApplicationUser Donor { get; set; }
        public ICollection<Request> Requests { get; set; } = new List<Request>();
    }

}
