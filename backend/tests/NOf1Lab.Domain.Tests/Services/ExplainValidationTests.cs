using NOf1Lab.Application.Services;

namespace NOf1Lab.Domain.Tests.Services;

public class ExplainValidationTests
{
    [Fact]
    public void ValidateNumbers_AcceptsKnownFigures()
    {
        var ok = ExplainService.ValidateNumbers(
            "Mean A was 5.200 and mean B was 7.400 with delta 2.200.",
            5.2m, 7.4m, 2.2m, 1.5m);

        Assert.True(ok);
    }

    [Fact]
    public void ValidateNumbers_RejectsInventedFigures()
    {
        var ok = ExplainService.ValidateNumbers(
            "The model predicts a 9.999 improvement that was not calculated.",
            5.2m, 7.4m, 2.2m, 1.5m);

        Assert.False(ok);
    }
}
