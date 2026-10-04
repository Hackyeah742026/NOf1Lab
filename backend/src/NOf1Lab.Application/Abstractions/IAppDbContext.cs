using Microsoft.EntityFrameworkCore;
using NOf1Lab.Domain.Entities;

namespace NOf1Lab.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<ExperimentTemplate> Templates { get; }
    DbSet<Experiment> Experiments { get; }
    DbSet<CheckIn> CheckIns { get; }
    DbSet<ExperimentResult> ExperimentResults { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
