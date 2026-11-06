using BackendApi.Models;
using Microsoft.AspNetCore.Identity;

    public class ApplicationUser : IdentityUser
    {
        public string Role { get; set; }
        public bool IsBlocked { get; set; } = false;
    public ICollection<Material> Materials { get; set; }
        public ICollection<Request> Requests { get; set; }
    }


