using Microsoft.EntityFrameworkCore;
using Pangeum.API.Entities;

namespace Pangeum.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UploadEntity> Uploads => Set<UploadEntity>();
    public DbSet<JobEntity> Jobs => Set<JobEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UploadEntity>(entity =>
        {
            entity.HasKey(e => e.UploadId);
            entity.Property(e => e.OriginalFileName).HasMaxLength(255);
            entity.Property(e => e.StoredPath).HasMaxLength(500);
        });

        modelBuilder.Entity<JobEntity>(entity =>
        {
            entity.HasKey(e => e.JobId);
            entity.Property(e => e.Status).HasMaxLength(50);
            entity.Property(e => e.SvgPath).HasMaxLength(500);

            entity.HasOne(e => e.Upload)
                  .WithOne(u => u.Job)
                  .HasForeignKey<JobEntity>(e => e.UploadId);
        });
    }
}
