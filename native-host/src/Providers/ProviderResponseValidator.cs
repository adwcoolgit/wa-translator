using System.Text.RegularExpressions;

namespace WaTranslator.Providers;

public sealed class ProviderResponseValidationException : Exception
{
    public ProviderResponseValidationException(string errorCode, string recoveryAction, string message)
        : base(message)
    {
        ErrorCode = errorCode;
        RecoveryAction = recoveryAction;
    }

    public string ErrorCode { get; }

    public string RecoveryAction { get; }
}

public sealed class ProviderResponseValidator
{
    private static readonly Regex MetaPrefixPattern = new(
        @"^\s*(translation|translated\s+text|result|output)\s*:",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex CommentaryPrefixPattern = new(
        @"^\s*(here(?:'s|\s+is)\s+the\s+translation|option\s*\d+\s*:)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public string ValidateTranslationText(string? outputText)
    {
        var candidate = outputText?.Trim();
        if (string.IsNullOrWhiteSpace(candidate))
        {
            throw new ProviderResponseValidationException(
                errorCode: "PROVIDER_INVALID_OUTPUT",
                recoveryAction: "openDiagnostics",
                message: "Provider returned an empty translation output.");
        }

        if (candidate.Length > 12_000)
        {
            throw new ProviderResponseValidationException(
                errorCode: "PROVIDER_INVALID_OUTPUT",
                recoveryAction: "openDiagnostics",
                message: "Provider returned output that exceeds the translation contract limit.");
        }

        if (ContainsAny(candidate, "```", "<script", "</script>", "Traceback", "Unhandled exception", "stack trace"))
        {
            throw new ProviderResponseValidationException(
                errorCode: "PROVIDER_INVALID_OUTPUT",
                recoveryAction: "openDiagnostics",
                message: "Provider output contains unsafe or non-translation content.");
        }

        if (MetaPrefixPattern.IsMatch(candidate) || CommentaryPrefixPattern.IsMatch(candidate))
        {
            throw new ProviderResponseValidationException(
                errorCode: "PROVIDER_INVALID_OUTPUT",
                recoveryAction: "openDiagnostics",
                message: "Provider output contains commentary or labels instead of pure translated text.");
        }

        return candidate;
    }

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
