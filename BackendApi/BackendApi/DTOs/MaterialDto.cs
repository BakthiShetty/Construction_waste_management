namespace BackendApi.DTOs
{
    public class MaterialDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Location { get; set; } = string.Empty;
        public decimal Price { get; set; }          //  NEW
        public IFormFile? Image { get; set; }
    }
}