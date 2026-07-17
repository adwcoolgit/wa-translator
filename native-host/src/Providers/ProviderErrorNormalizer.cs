namespace WaTranslator.Providers;

public sealed class ProviderErrorNormalizer
{
    public ProviderHealthError NormalizeTimeout() =>
        CreateError("PROVIDER_TIMEOUT", "retry", "provider", "warning");

    public ProviderHealthError NormalizeMissingExecutable() =>
        CreateError("PROVIDER_NOT_FOUND", "selectExecutable");

    public ProviderHealthError NormalizeInputTooLarge() =>
        CreateError("INPUT_TOO_LARGE", "dismiss", "extension", "warning");

    public ProviderHealthError NormalizeExecutionFailure(string combinedOutput)
    {
        if (ContainsAny(combinedOutput, "sign in", "sign-in", "log in", "login", "authenticate", "authentication", "not authenticated", "setup-token"))
        {
            return CreateError("PROVIDER_AUTH_REQUIRED", "signInWithCli", "provider", "warning");
        }

        if (ContainsAny(combinedOutput, "rate limit", "too many requests", "quota", "overloaded"))
        {
            return CreateError("PROVIDER_RATE_LIMIT", "retry", "provider", "warning");
        }

        if (ContainsAny(combinedOutput, "access is denied", "permission denied", "sandbox", "unsafe"))
        {
            return CreateError("PROVIDER_UNSAFE_CONFIGURATION", "openDiagnostics");
        }

        return CreateError("PROVIDER_INVALID_OUTPUT", "openDiagnostics");
    }

    public ProviderHealthError NormalizeException(Exception exception)
    {
        var message = exception.Message.ToLowerInvariant();
        if (message.Contains("cannot find") || message.Contains("not found"))
        {
            return NormalizeMissingExecutable();
        }

        if (message.Contains("access is denied") || message.Contains("permission denied"))
        {
            return CreateError("PROVIDER_UNSAFE_CONFIGURATION", "openDiagnostics");
        }

        return CreateError("PROVIDER_INVALID_OUTPUT", "openDiagnostics");
    }

    public ProviderHealthError CreateError(
        string errorCode,
        string recoveryAction,
        string component = "provider",
        string severity = "blocking") =>
        new(
            Code: errorCode,
            Component: component,
            Severity: severity,
            RecoveryAction: recoveryAction,
            SupportCode: errorCode);

    private static bool ContainsAny(string value, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (value.Contains(candidate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}