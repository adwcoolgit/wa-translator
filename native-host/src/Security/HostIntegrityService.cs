namespace WaTranslator.Security;

public sealed record HostIntegrityResult(
    bool IsValid,
    string? ErrorCode,
    string? RecoveryAction,
    string ExpectedVersion,
    string ActualVersion,
    string ExpectedProtocolVersion,
    string ActualProtocolVersion);

public sealed class HostIntegrityService
{
    public HostIntegrityResult Validate(
        string expectedVersion,
        string actualVersion,
        string expectedProtocolVersion,
        string actualProtocolVersion,
        bool binaryPresent = true)
    {
        if (!binaryPresent)
        {
            return new HostIntegrityResult(
                IsValid: false,
                ErrorCode: "HOST_NOT_FOUND",
                RecoveryAction: "installCompanion",
                ExpectedVersion: expectedVersion,
                ActualVersion: actualVersion,
                ExpectedProtocolVersion: expectedProtocolVersion,
                ActualProtocolVersion: actualProtocolVersion);
        }

        if (!string.Equals(expectedProtocolVersion, actualProtocolVersion, StringComparison.Ordinal))
        {
            return new HostIntegrityResult(
                IsValid: false,
                ErrorCode: "HOST_VERSION_MISMATCH",
                RecoveryAction: "updateCompanion",
                ExpectedVersion: expectedVersion,
                ActualVersion: actualVersion,
                ExpectedProtocolVersion: expectedProtocolVersion,
                ActualProtocolVersion: actualProtocolVersion);
        }

        var expectedParsed = TryParseVersion(expectedVersion);
        var actualParsed = TryParseVersion(actualVersion);
        if (expectedParsed is null || actualParsed is null)
        {
            return new HostIntegrityResult(
                IsValid: false,
                ErrorCode: "HOST_INTEGRITY_FAILED",
                RecoveryAction: "updateCompanion",
                ExpectedVersion: expectedVersion,
                ActualVersion: actualVersion,
                ExpectedProtocolVersion: expectedProtocolVersion,
                ActualProtocolVersion: actualProtocolVersion);
        }

        if (!expectedParsed.Equals(actualParsed))
        {
            return new HostIntegrityResult(
                IsValid: false,
                ErrorCode: "HOST_VERSION_MISMATCH",
                RecoveryAction: "updateCompanion",
                ExpectedVersion: expectedVersion,
                ActualVersion: actualVersion,
                ExpectedProtocolVersion: expectedProtocolVersion,
                ActualProtocolVersion: actualProtocolVersion);
        }

        return new HostIntegrityResult(
            IsValid: true,
            ErrorCode: null,
            RecoveryAction: null,
            ExpectedVersion: expectedVersion,
            ActualVersion: actualVersion,
            ExpectedProtocolVersion: expectedProtocolVersion,
            ActualProtocolVersion: actualProtocolVersion);
    }

    private static Version? TryParseVersion(string version) =>
        Version.TryParse(version, out var parsed) ? parsed : null;
}
