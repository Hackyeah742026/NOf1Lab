using Microsoft.EntityFrameworkCore;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Application.Services;
using NOf1Lab.Domain.Entities;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Domain.Tests.Services;

/// <summary>
/// Documents CompleteAsync status gate: Active and Stopped may finalize; Draft may not.
/// </summary>
public class ExperimentCompleteStatusGateTests
{
    [Fact]
    public async Task CompleteAsync_AllowsStoppedExperiment_WithoutExistingResult()
    {
        await using var db = CreateDb();
        var userId = Guid.NewGuid();
        var experimentId = await SeedExperimentAsync(db, userId, ExperimentStatus.Stopped);

        var service = new ExperimentService(db, new NoOpCsvImportParser());
        var result = await service.CompleteAsync(userId, experimentId);

        Assert.True(result.IsSuccess);
        Assert.Equal(experimentId, result.Value.ExperimentId);

        var stored = await db.Experiments.SingleAsync(e => e.Id == experimentId);
        Assert.Equal(ExperimentStatus.Completed, stored.Status);
        Assert.NotNull(await db.ExperimentResults.SingleOrDefaultAsync(r => r.ExperimentId == experimentId));
    }

    [Fact]
    public async Task CompleteAsync_RejectsDraftExperiment()
    {
        await using var db = CreateDb();
        var userId = Guid.NewGuid();
        var experimentId = await SeedExperimentAsync(db, userId, ExperimentStatus.Draft);

        var service = new ExperimentService(db, new NoOpCsvImportParser());
        var result = await service.CompleteAsync(userId, experimentId);

        Assert.True(result.IsFailure);
        Assert.Contains(result.Errors, e => e.Code == "Experiment.InvalidStatus");
    }

    private static TestAppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TestAppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TestAppDbContext(options);
    }

    private static async Task<Guid> SeedExperimentAsync(
        TestAppDbContext db,
        Guid userId,
        ExperimentStatus status)
    {
        var template = new ExperimentTemplate
        {
            Key = "sleep",
            Title = "Sleep",
            Question = "Does earlier bedtime help?",
            Category = "sleep",
            MetricKey = "sleep_score",
            MetricLabel = "Sleep score",
            HigherIsBetter = true
        };
        db.Templates.Add(template);

        var experimentId = Guid.NewGuid();
        var experiment = new Experiment
        {
            Id = experimentId,
            UserId = userId,
            TemplateKey = template.Key,
            Hypothesis = template.Question,
            Status = status,
            StartDate = new DateOnly(2026, 3, 1),
            CreatedAt = DateTimeOffset.UtcNow,
            StopReason = status == ExperimentStatus.Stopped ? "Stopped by user." : null,
            CheckIns =
            [
                new CheckIn
                {
                    Id = Guid.NewGuid(),
                    ExperimentId = experimentId,
                    Day = new DateOnly(2026, 3, 1),
                    Phase = ExperimentPhase.A,
                    MetricValue = 5,
                    Adhered = true,
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new CheckIn
                {
                    Id = Guid.NewGuid(),
                    ExperimentId = experimentId,
                    Day = new DateOnly(2026, 3, 2),
                    Phase = ExperimentPhase.B,
                    MetricValue = 7,
                    Adhered = true,
                    CreatedAt = DateTimeOffset.UtcNow
                }
            ]
        };
        db.Experiments.Add(experiment);
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

    private sealed class NoOpCsvImportParser : ICsvImportParser
    {
        public IReadOnlyList<ImportedCheckInRow> Parse(Stream csvStream) => [];
    }
}
