// DTOs/MaterialResponseDto.cs
namespace BackendApi.DTOs
{
    public class MaterialResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public string Location { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public DateTime PostedDate { get; set; }
        public string DonorId { get; set; }
        public DonorDto? Donor { get; set; }
    }

    public class DonorDto
    {
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }
}
