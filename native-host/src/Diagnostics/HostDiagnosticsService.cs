using System.Text.RegularExpressions;

namespace WaTranslator.Diagnostics;

public sealed class HostDiagnosticsService
{
    private static readonly Regex WindowsPathPattern = new("[A-Za-z]:\\\\[^\\s\"']+", RegexOptions.Compiled);

    public string? SanitizeStandardError(string? standardError)
    {
        if (string.IsNullOrWhiteSpace(standardError))
        {
            return null;
        }

        var sanitized = WindowsPathPattern.Replace(standardError, "[redacted-path]");
        sanitized = sanitized.Replace("token", "[redacted-token]", StringComparison.OrdinalIgnoreCase);
        return sanitized.Length > 400 ? sanitized[..400] : sanitized;
    }

    public string? SanitizeExecutablePath(string? executablePath)
    {
        if (string.IsNullOrWhiteSpace(executablePath))
        {
            return null;
        }

        return Path.GetFileName(executablePath.Trim());
    }

    public SanitizedDiagnosticEvent CreateLifecycleEvent(
        string eventType,
        IReadOnlyDictionary<string, string?> properties,
        string redactionStatus = "redacted")
    {
        var safeProperties = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in properties)
        {
            if (string.Equals(key, "fullExecutablePath", StringComparison.OrdinalIgnoreCase))
            {
                safeProperties["executableName"] = SanitizeExecutablePath(value);
                continue;
            }

            if (string.Equals(key, "rawStderr", StringComparison.OrdinalIgnoreCase))
            {
                safeProperties["sanitizedStderr"] = SanitizeStandardError(value);
                continue;
            }

            safeProperties[key] = value;
        }

        return SanitizedDiagnosticEvent.Create(eventType, safeProperties, redactionStatus);
    }
}