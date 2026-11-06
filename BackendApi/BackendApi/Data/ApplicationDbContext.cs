using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BackendApi.Models;
using System.Collections.Generic;
using System.Reflection.Emit;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : base(options) { }

    public DbSet<Material> Materials { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }


    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Donor → Material (one-to-many)
        builder.Entity<Material>()
               .HasOne(m => m.Donor)
               .WithMany(u => u.Materials)
               .HasForeignKey(m => m.DonorId)
               .OnDelete(DeleteBehavior.Restrict); //  Prevent cascading

        // Receiver → Request (one-to-many)
        builder.Entity<Request>()
               .HasOne(r => r.Receiver)
               .WithMany(u => u.Requests)
               .HasForeignKey(r => r.ReceiverId)
               .OnDelete(DeleteBehavior.Restrict); //  Prevent cascading

        // Material → Request (one-to-many)
        builder.Entity<Request>()
               .HasOne(r => r.Material)
               .WithMany()
               .HasForeignKey(r => r.MaterialId)
               .OnDelete(DeleteBehavior.Cascade); 
    }


}
