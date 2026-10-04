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

        await SeedTemplatesAsync(db);

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

    /// <summary>
    /// Inserts templates whose Key is missing. Existing rows are left intact for demo stability.
    /// </summary>
    private static async Task SeedTemplatesAsync(AppDbContext db)
    {
        var desired = CreateTemplates().ToList();
        var existingKeys = await db.Templates.AsNoTracking()
            .Select(t => t.Key)
            .ToListAsync();
        var existing = existingKeys.ToHashSet(StringComparer.Ordinal);

        var missing = desired.Where(t => !existing.Contains(t.Key)).ToList();
        if (missing.Count == 0)
        {
            return;
        }

        db.Templates.AddRange(missing);
        await db.SaveChangesAsync();
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
        },
        new()
        {
            Key = "evening-walk",
            Title = "Evening walk → sleep quality",
            Question = "Does a 20-minute evening walk improve sleep quality?",
            Description = "Phase A: usual evening routine. Phase B: a short outdoor walk after dinner.",
            Category = "physical",
            MetricKey = "sleep",
            MetricLabel = "Sleep quality (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual evening",
            PhaseBLabel = "Evening walk",
            HigherIsBetter = true
        },
        new()
        {
            Key = "strength-2x",
            Title = "Strength 2×/week → energy",
            Question = "Does two short strength sessions per week improve weekday energy?",
            Description = "Phase A: no planned strength work. Phase B: two 30–40 minute strength sessions.",
            Category = "sport",
            MetricKey = "energy",
            MetricLabel = "Weekday energy (1-10)",
            DaysPerPhase = 7,
            PhaseALabel = "No strength plan",
            PhaseBLabel = "Strength 2×/week",
            HigherIsBetter = true
        },
        new()
        {
            Key = "phone-free-first-hour",
            Title = "Phone-free first hour → focus",
            Question = "Does staying phone-free for the first hour after waking improve focus?",
            Description = "Phase A: usual phone use on waking. Phase B: no phone for the first 60 minutes.",
            Category = "mental",
            MetricKey = "focus",
            MetricLabel = "Morning focus (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual phone use",
            PhaseBLabel = "Phone-free first hour",
            HigherIsBetter = true
        },
        new()
        {
            Key = "protein-breakfast",
            Title = "Protein breakfast → afternoon energy",
            Question = "Does a higher-protein breakfast reduce the afternoon energy dip?",
            Description = "Phase A: usual breakfast. Phase B: aim for ~25–30g protein at breakfast.",
            Category = "lifestyle",
            MetricKey = "afternoon-energy",
            MetricLabel = "Afternoon energy (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual breakfast",
            PhaseBLabel = "Protein-forward breakfast",
            HigherIsBetter = true
        },
        new()
        {
            Key = "hydration-2l",
            Title = "Hydration 2L/day → comfort",
            Question = "Does drinking at least 2 liters of water per day improve energy and reduce headache burden?",
            Description = "Phase A: usual fluid intake. Phase B: hit a clear 2L water target daily.",
            Category = "physical",
            MetricKey = "comfort-energy",
            MetricLabel = "Energy / comfort (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual hydration",
            PhaseBLabel = "2L water target",
            HigherIsBetter = true
        },
        new()
        {
            Key = "midday-stretch",
            Title = "Midday stretch break → back comfort",
            Question = "Does a 5-minute midday stretch break improve back comfort and focus?",
            Description = "Phase A: usual midday routine. Phase B: one short stretch/mobility break around midday.",
            Category = "physical+mental",
            MetricKey = "back-comfort",
            MetricLabel = "Back comfort / focus (1-10)",
            DaysPerPhase = 5,
            PhaseALabel = "Usual midday",
            PhaseBLabel = "Midday stretch break",
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
