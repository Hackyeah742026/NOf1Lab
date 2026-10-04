using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Domain.Entities;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Infrastructure.Persistence;

public static class DbSeeder
{
    public const string DemoEmail = "demo@nof1lab.local";
    public const string DemoPassword = "Demo123!";

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        await db.Database.EnsureCreatedAsync();

        if (!await db.Templates.AnyAsync())
        {
            db.Templates.AddRange(CreateTemplates());
            await db.SaveChangesAsync();
        }

        var demoUser = await db.Users.SingleOrDefaultAsync(u => u.Email == DemoEmail);
        if (demoUser is null)
        {
            demoUser = new User
            {
                Id = Guid.NewGuid(),
                Email = DemoEmail,
                PasswordHash = hasher.Hash(DemoPassword),
                Language = "en",
                CreatedAt = DateTimeOffset.UtcNow
            };
            db.Users.Add(demoUser);
            await db.SaveChangesAsync();
        }

        if (!await db.Experiments.AnyAsync(e => e.UserId == demoUser.Id && e.Status == ExperimentStatus.Completed))
        {
            await SeedCompletedDemoExperimentAsync(db, demoUser.Id);
        }
    }

    private static IEnumerable<ExperimentTemplate> CreateTemplates() =>
    [
        new()
        {
            Key = "earlier-bedtime",
            Title = "Earlier bedtime → energy",
            Question = "Does going to bed 45 minutes earlier improve next-day energy?",
            Description = "Compare your usual bedtime (A) with an earlier lights-out window (B).",
            Category = "physical+mental",
            MetricKey = "energy",
            MetricLabel = "Next-day energy (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual bedtime",
            PhaseBLabel = "Earlier bedtime",
            HigherIsBetter = true
        },
        new()
        {
            Key = "training-load",
            Title = "3× training vs 2× + walks",
            Question = "Does reducing hard sessions improve recovery?",
            Description = "Phase A: three hard sessions. Phase B: two hard sessions plus easy walks.",
            Category = "sport",
            MetricKey = "recovery",
            MetricLabel = "Recovery / readiness (1-10)",
            DaysPerPhase = 7,
            PhaseALabel = "3× hard training",
            PhaseBLabel = "2× hard + walks",
            HigherIsBetter = true
        },
        new()
        {
            Key = "morning-light",
            Title = "Morning outdoor light → focus",
            Question = "Does 10 minutes of morning outdoor light improve focus?",
            Description = "Phase A: usual morning. Phase B: outdoor light within an hour of waking.",
            Category = "mental",
            MetricKey = "focus",
            MetricLabel = "Focus (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual morning",
            PhaseBLabel = "Outdoor light",
            HigherIsBetter = true
        },
        new()
        {
            Key = "caffeine-cutoff",
            Title = "Caffeine cutoff 14:00 → sleep",
            Question = "Does cutting caffeine after 14:00 improve sleep quality?",
            Description = "Phase A: usual caffeine. Phase B: no caffeine after 14:00.",
            Category = "physical",
            MetricKey = "sleep",
            MetricLabel = "Sleep quality (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual caffeine",
            PhaseBLabel = "14:00 cutoff",
            HigherIsBetter = true
        },
        new()
        {
            Key = "no-delivery-dinners",
            Title = "No weekday delivery dinners",
            Question = "Does cooking instead of delivery improve evening energy/mood?",
            Description = "Phase A: delivery-friendly weekdays. Phase B: no delivery dinners Mon–Fri.",
            Category = "lifestyle",
            MetricKey = "mood-energy",
            MetricLabel = "Evening energy/mood (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Delivery allowed",
            PhaseBLabel = "Home-cooked weekdays",
            HigherIsBetter = true
        }
    ];

    private static async Task SeedCompletedDemoExperimentAsync(AppDbContext db, Guid userId)
    {
        var start = new DateOnly(2026, 9, 1);
        var experiment = new Experiment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TemplateKey = "earlier-bedtime",
            Hypothesis = "Does going to bed 45 minutes earlier improve next-day energy?",
            Status = ExperimentStatus.Completed,
            StartDate = start,
            PhaseAEnd = start.AddDays(4),
            EndDate = start.AddDays(9),
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-20)
        };

        var valuesA = new[] { 5.0m, 5.5m, 4.5m, 5.0m, 6.0m };
        var valuesB = new[] { 7.0m, 7.5m, 6.5m, 8.0m, 7.0m };

        for (var i = 0; i < 5; i++)
        {
            experiment.CheckIns.Add(new CheckIn
            {
                Id = Guid.NewGuid(),
                Day = start.AddDays(i),
                Phase = ExperimentPhase.A,
                MetricValue = valuesA[i],
                Adhered = true,
                Notes = "Baseline",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-20 + i)
            });
        }

        for (var i = 0; i < 5; i++)
        {
            experiment.CheckIns.Add(new CheckIn
            {
                Id = Guid.NewGuid(),
                Day = start.AddDays(5 + i),
                Phase = ExperimentPhase.B,
                MetricValue = valuesB[i],
                Adhered = true,
                Notes = "Earlier bedtime",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15 + i)
            });
        }

        var analysis = Domain.Analysis.ExperimentAnalyzer.Analyze(new Domain.Analysis.AnalysisInput(
            experiment.CheckIns.Select(c => new Domain.Analysis.AnalysisCheckIn(c.Day, c.Phase, c.MetricValue, c.Adhered)).ToList(),
            HigherIsBetter: true)).Value;

        experiment.Result = new ExperimentResult
        {
            Id = Guid.NewGuid(),
            MeanA = analysis.MeanA,
            MeanB = analysis.MeanB,
            Delta = analysis.Delta,
            EffectSize = analysis.EffectSize,
            AdherenceA = analysis.AdherenceA,
            AdherenceB = analysis.AdherenceB,
            SampleSizeA = analysis.SampleSizeA,
            SampleSizeB = analysis.SampleSizeB,
            Verdict = analysis.Verdict,
            EvidenceJson = analysis.EvidenceJson,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-10)
        };

        db.Experiments.Add(experiment);
        await db.SaveChangesAsync();
    }
}
