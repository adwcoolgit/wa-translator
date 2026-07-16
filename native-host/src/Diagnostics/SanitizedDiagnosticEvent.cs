namespace WaTranslator.Diagnostics;

internal sealed record SanitizedDiagnosticEvent(
    string EventType,
    DateTimeOffset Timestamp,
    IReadOnlyDictionary<string, string?> Properties,
    string RedactionStatus)
{
    private static readonly HashSet<string> ProhibitedKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "sourceText",
        "translatedText",
        "messageText",
        "rawStderr",
        "contactIdentity",
        "chatIdentity",
        "accountIdentifier",
        "credential",
        "token",
        "fullExecutablePath",
        "messageHash",
        "conversationDomSnapshot"
    };

    public static SanitizedDiagnosticEvent Create(
        string eventType,
        IReadOnlyDictionary<string, string?> properties,
        string redactionStatus)
    {
        foreach (var key in properties.Keys)
        {
            if (ProhibitedKeys.Contains(key))
            {
                throw new InvalidOperationException($"Diagnostics property '{key}' is prohibited.");
            }
        }

        return new SanitizedDiagnosticEvent(eventType, DateTimeOffset.UtcNow, properties, redactionStatus);
    }
}
