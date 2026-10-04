using NOf1Lab.Domain.Common;

namespace NOf1Lab.Domain.Tests.Common;

public class ResultTests
{
    [Fact]
    public void Ok_IsSuccess_WithoutErrors()
    {
        var result = Result.Ok();

        Assert.True(result.IsSuccess);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Fail_IsFailure_WithErrors()
    {
        var error = Error.Validation("Experiment.Invalid", "Invalid experiment.");
        var result = Result.Fail(error);

        Assert.True(result.IsFailure);
        Assert.Single(result.Errors);
        Assert.Equal(error, result.Errors[0]);
    }

    [Fact]
    public void GenericOk_ExposesValue()
    {
        var result = Result<int>.Ok(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public void GenericFail_Throws_WhenAccessingValue()
    {
        var result = Result<int>.Fail(Error.NotFound("Experiment.NotFound", "Missing."));

        Assert.Throws<InvalidOperationException>(() => _ = result.Value);
    }
}
