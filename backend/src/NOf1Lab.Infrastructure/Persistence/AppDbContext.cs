using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<ExperimentTemplate> Templates => Set<ExperimentTemplate>();
    public DbSet<Experiment> Experiments => Set<Experiment>();
    public DbSet<CheckIn> CheckIns => Set<CheckIn>();
    public DbSet<ExperimentResult> ExperimentResults => Set<ExperimentResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(256).IsRequired();
            entity.Property(x => x.PasswordHash).IsRequired();
            entity.Property(x => x.Language).HasMaxLength(8).IsRequired();
        });

        modelBuilder.Entity<ExperimentTemplate>(entity =>
        {
            entity.HasKey(x => x.Key);
            entity.Property(x => x.Key).HasMaxLength(64);
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Question).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(64).IsRequired();
            entity.Property(x => x.MetricKey).HasMaxLength(64).IsRequired();
            entity.Property(x => x.MetricLabel).HasMaxLength(120).IsRequired();
        });

        modelBuilder.Entity<Experiment>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TemplateKey).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Hypothesis).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasOne(x => x.User).WithMany(x => x.Experiments).HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Template).WithMany().HasForeignKey(x => x.TemplateKey);
            entity.HasOne(x => x.Result).WithOne(x => x.Experiment).HasForeignKey<ExperimentResult>(x => x.ExperimentId);
        });

        modelBuilder.Entity<CheckIn>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Phase).HasConversion<string>().HasMaxLength(8);
            entity.Property(x => x.MetricValue).HasPrecision(10, 3);
            entity.HasIndex(x => new { x.ExperimentId, x.Day }).IsUnique();
            entity.HasOne(x => x.Experiment).WithMany(x => x.CheckIns).HasForeignKey(x => x.ExperimentId);
        });

        modelBuilder.Entity<ExperimentResult>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Verdict).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.MeanA).HasPrecision(10, 3);
            entity.Property(x => x.MeanB).HasPrecision(10, 3);
            entity.Property(x => x.Delta).HasPrecision(10, 3);
            entity.Property(x => x.EffectSize).HasPrecision(10, 3);
            entity.Property(x => x.AdherenceA).HasPrecision(10, 3);
            entity.Property(x => x.AdherenceB).HasPrecision(10, 3);
            entity.HasIndex(x => x.ExperimentId).IsUnique();
        });
    }
}
