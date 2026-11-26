using MELIO.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MELIO.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<User>();
        user.HasKey(entity => entity.Id);
        user.Property(entity => entity.Name).IsRequired().HasMaxLength(100);
        user.Property(entity => entity.Email).IsRequired().HasMaxLength(254).UseCollation("SQL_Latin1_General_CP1_CI_AS");
        user.HasIndex(entity => entity.Email).IsUnique();
        user.Property(entity => entity.PasswordHash).IsRequired();
        user.Property(entity => entity.CreatedAt).IsRequired();

        var task = modelBuilder.Entity<TaskItem>();
        task.HasKey(entity => entity.Id);
        task.Property(entity => entity.Title).IsRequired().HasMaxLength(120);
        task.Property(entity => entity.Category).IsRequired().HasMaxLength(60);
        task.Property(entity => entity.CreatedAt).IsRequired();
        task.HasOne<User>()
            .WithMany()
            .HasForeignKey(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        task.HasIndex(entity => new { entity.UserId, entity.CreatedAt });
    }
}
