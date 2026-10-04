using System.Globalization;
using NOf1Lab.Application.Abstractions;
using NOf1Lab.Domain.Enums;

namespace NOf1Lab.Infrastructure.Import;

public sealed class CsvImportParser : ICsvImportParser
{
    public IReadOnlyList<ImportedCheckInRow> Parse(Stream csvStream)
    {
        using var reader = new StreamReader(csvStream);
        var rows = new List<ImportedCheckInRow>();
        string? line;
        var isHeader = true;

        while ((line = reader.ReadLine()) is not null)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var parts = line.Split(',');
            if (parts.Length < 4)
            {
                throw new InvalidOperationException("CSV rows must include day,phase,metric,adhered.");
            }

            if (isHeader && LooksLikeHeader(parts))
            {
                isHeader = false;
                continue;
            }

            isHeader = false;

            if (!DateOnly.TryParse(parts[0].Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
            {
                throw new InvalidOperationException($"Invalid day value '{parts[0]}'.");
            }

            if (!Enum.TryParse<ExperimentPhase>(parts[1].Trim(), ignoreCase: true, out var phase))
            {
                throw new InvalidOperationException($"Invalid phase value '{parts[1]}'.");
            }

            if (!decimal.TryParse(parts[2].Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var metric))
            {
                throw new InvalidOperationException($"Invalid metric value '{parts[2]}'.");
            }

            var adhered = ParseBool(parts[3].Trim());
            var notes = parts.Length > 4 ? NullIfEmpty(parts[4].Trim()) : null;
            var safety = parts.Length > 5 && ParseBool(parts[5].Trim());

            rows.Add(new ImportedCheckInRow(day, phase, metric, adhered, notes, safety));
        }

        return rows;
    }

    private static bool LooksLikeHeader(string[] parts) =>
        parts[0].Contains("day", StringComparison.OrdinalIgnoreCase)
        || parts[1].Contains("phase", StringComparison.OrdinalIgnoreCase);

    private static bool ParseBool(string value) =>
        value is "1" or "true" or "True" or "yes" or "YES" or "y" or "Y";

    private static string? NullIfEmpty(string value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;
}
