namespace NOf1Lab.Domain.Common;

public class Result
{
    protected Result(bool isSuccess, IReadOnlyList<Error> errors)
    {
        if (isSuccess && errors.Count > 0)
        {
            throw new InvalidOperationException("Successful result cannot contain errors.");
        }

        if (!isSuccess && errors.Count == 0)
        {
            throw new InvalidOperationException("Failed result must contain at least one error.");
        }

        IsSuccess = isSuccess;
        Errors = errors;
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public IReadOnlyList<Error> Errors { get; }

    public static Result Ok() => new(true, Array.Empty<Error>());

    public static Result Fail(params Error[] errors) =>
        new(false, errors.Length == 0
            ? [Error.Failure("General.Failure", "An unexpected error occurred.")]
            : errors);

    public static Result Fail(IEnumerable<Error> errors) => Fail(errors.ToArray());
}

public class Result<T> : Result
{
    private readonly T? _value;

    private Result(T value)
        : base(true, Array.Empty<Error>())
    {
        _value = value;
    }

    private Result(IReadOnlyList<Error> errors)
        : base(false, errors)
    {
        _value = default;
    }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access value of a failed result.");

    public static Result<T> Ok(T value) => new(value);

    public new static Result<T> Fail(params Error[] errors) =>
        new(errors.Length == 0
            ? [Error.Failure("General.Failure", "An unexpected error occurred.")]
            : errors);

    public new static Result<T> Fail(IEnumerable<Error> errors) => Fail(errors.ToArray());

    public static implicit operator Result<T>(T value) => Ok(value);
}
