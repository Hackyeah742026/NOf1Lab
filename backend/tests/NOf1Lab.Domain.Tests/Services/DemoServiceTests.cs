using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Services;
using NOf1Lab.Domain.Entities;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Tests.Services;

public class DemoServiceTests
{
    [Fact]
    public async Task GetShowcaseAsync_PrefersCompletedEarlierBedtimeWithResult()
    {
        await using var db = CreateDb();
        var userId = Guid.NewGuid();
        await SeedTemplateAsync(db, "caffeine-cutoff", "Caffeine cutoff");
        await SeedTemplateAsync(db, "earlier-bedtime", "Earlier bedtime");

        var otherId = await SeedCompletedAsync(
            db, userId, "caffeine-cutoff", Verdict.Drop, DateTimeOffset.UtcNow.AddDays(-1));
        var preferredId = await SeedCompletedAsync(
            db, userId, "earlier-bedtime", Verdict.Keep, DateTimeOffset.UtcNow.AddDays(-10));

        var service = new DemoService(db);
        var result = await service.GetShowcaseAsync(userId);

        Assert.True(result.IsSuccess);
        Assert.Equal(preferredId, result.Value.ExperimentId);
        Assert.Equal("earlier-bedtime", result.Value.TemplateKey);
        Assert.Equal("Earlier bedtime", result.Value.TemplateTitle);
        Assert.Equal(Verdict.Keep, result.Value.Verdict);
        Assert.Equal(ExperimentStatus.Completed, result.Value.Status);
        Assert.NotEqual(otherId, result.Value.ExperimentId);
    }

    [Fact]
    public async Task GetShowcaseAsync_FallsBackToFirstCompletedWithResult()
    {
        await using var db = CreateDb();
        var userId = Guid.NewGuid();
        await SeedTemplateAsync(db, "caffeine-cutoff", "Caffeine cutoff");

        var olderId = await SeedCompletedAsync(
            db, userId, "caffeine-cutoff", Verdict.Modify, DateTimeOffset.UtcNow.AddDays(-5));
        var newerId = await SeedCompletedAsync(
            db, userId, "caffeine-cutoff", Verdict.Keep, DateTimeOffset.UtcNow.AddDays(-1));

        var service = new DemoService(db);
        var result = await service.GetShowcaseAsync(userId);

        Assert.True(result.IsSuccess);
        Assert.Equal(newerId, result.Value.ExperimentId);
        Assert.Equal("caffeine-cutoff", result.Value.TemplateKey);
        Assert.NotEqual(olderId, result.Value.ExperimentId);
    }

    [Fact]
    public async Task GetShowcaseAsync_ReturnsNotFound_WhenNoCompletedResult()
    {
        await using var db = CreateDb();
        var userId = Guid.NewGuid();
        await SeedTemplateAsync(db, "earlier-bedtime", "Earlier bedtime");

        db.Experiments.Add(new Experiment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TemplateKey = "earlier-bedtime",
            Hypothesis = "Test",
            Status = ExperimentStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        var service = new DemoService(db);
        var result = await service.GetShowcaseAsync(userId);

        Assert.True(result.IsFailure);
        Assert.Contains(result.Errors, e => e.Code == "Demo.ShowcaseNotFound");
    }

    private static TestAppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TestAppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    private static async Task SeedTemplateAsync(TestAppDbContext db, string key, string title)
    {
        if (await db.Templates.AnyAsync(t => t.Key == key))
        {
            return;
        }

        db.Templates.Add(new ExperimentTemplate
        {
            Key = key,
            Title = title,
            Question = title,
            Category = "lifestyle",
            MetricKey = "energy",
            MetricLabel = "Energy",
            HigherIsBetter = true
        });
        await db.SaveChangesAsync();
    }

    private static async Task<Guid> SeedCompletedAsync(
        TestAppDbContext db,
        Guid userId,
        string templateKey,
        Verdict verdict,
        DateTimeOffset createdAt)
    {
        var experimentId = Guid.NewGuid();
        db.Experiments.Add(new Experiment
        {
            Id = experimentId,
            UserId = userId,
            TemplateKey = templateKey,
            Hypothesis = "Hypothesis",
            Status = ExperimentStatus.Completed,
            CreatedAt = createdAt,
            Result = new ExperimentResult
            {
                Id = Guid.NewGuid(),
                ExperimentId = experimentId,
                MeanA = 5,
                MeanB = 7,
                Delta = 2,
                EffectSize = 1.2m,
                AdherenceA = 1,
                AdherenceB = 1,
                SampleSizeA = 5,
                SampleSizeB = 5,
                Verdict = verdict,
                EvidenceJson = "{}",
                CreatedAt = createdAt
            }
        });
        await db.SaveChangesAsync();
        return experimentId;
    }

    private sealed class TestAppDbContext(DbContextOptions<TestAppDbContext> options)
        : DbContext(options), IAppDbContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<ExperimentTemplate> Templates => Set<ExperimentTemplate>();
        public DbSet<Experiment> Experiments => Set<Experiment>();
        public DbSet<CheckIn> CheckIns => Set<CheckIn>();
        public DbSet<ExperimentResult> ExperimentResults => Set<ExperimentResult>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ExperimentTemplate>().HasKey(x => x.Key);
            modelBuilder.Entity<Experiment>().HasKey(x => x.Id);
            modelBuilder.Entity<Experiment>()
                .HasOne(x => x.Template)
                .WithMany()
                .HasForeignKey(x => x.TemplateKey);
            modelBuilder.Entity<Experiment>()
                .HasOne(x => x.Result)
                .WithOne(x => x.Experiment)
                .HasForeignKey<ExperimentResult>(x => x.ExperimentId);
            modelBuilder.Entity<CheckIn>().HasKey(x => x.Id);
            modelBuilder.Entity<CheckIn>()
                .HasOne(x => x.Experiment)
                .WithMany(x => x.CheckIns)
                .HasForeignKey(x => x.ExperimentId);
            modelBuilder.Entity<ExperimentResult>().HasKey(x => x.Id);
            modelBuilder.Entity<User>().HasKey(x => x.Id);
        }
    }
}
