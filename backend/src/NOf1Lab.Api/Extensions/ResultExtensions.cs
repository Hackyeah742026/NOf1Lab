using NOf1Lab.Domain.Common;

namespace NOf1Lab.Api.Extensions;

public static class ResultExtensions
{
    public static IResult ToHttpResult(this Result result) =>
        result.IsSuccess
            ? Results.NoContent()
            : ToProblemResult(result.Errors);

    public static IResult ToHttpResult<T>(this Result<T> result) =>
        result.IsSuccess
            ? Results.Ok(result.Value)
            : ToProblemResult(result.Errors);

    public static IResult ToHttpResult<T>(this Result<T> result, int successStatusCode) =>
        result.IsSuccess
            ? Results.Json(result.Value, statusCode: successStatusCode)
            : ToProblemResult(result.Errors);

    public static IResult ToCreatedResult<T>(this Result<T> result, string location) =>
        result.IsSuccess
            ? Results.Created(location, result.Value)
            : ToProblemResult(result.Errors);

    private static IResult ToProblemResult(IReadOnlyList<Error> errors)
    {
        var primary = errors[0];
        var statusCode = primary.Type switch
        {
            ErrorType.Validation => StatusCodes.Status400BadRequest,
            ErrorType.NotFound => StatusCodes.Status404NotFound,
            ErrorType.Conflict => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest
        };

        return Results.Problem(
            title: primary.Code,
            detail: primary.Message,
            statusCode: statusCode,
            extensions: new Dictionary<string, object?>
            {
                ["errors"] = errors.Select(e => new { e.Code, e.Message, Type = e.Type.ToString() })
            });
    }
}
