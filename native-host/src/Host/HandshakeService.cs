using WaTranslator.Host.Protocol;

namespace WaTranslator.Host;

public sealed record HostLifecycleSnapshot(
    bool HostDetected = true,
    bool ProtocolCompatible = true,
    bool ExtensionRegistered = true,
    bool PermissionsAvailable = true,
    bool IntegrityValid = true,
    string? HostVersion = HandshakeService.DefaultHostVersion,
    string? ProtocolVersion = NativeMessagingProtocol.ProtocolVersion);

public sealed class HandshakeService
{
    public const string DefaultHostVersion = "0.0.0-dev";

    private readonly HashSet<string> allowedExtensionIds;

    public HandshakeService(
        IEnumerable<string>? allowedExtensionIds = null,
        bool integrityValid = true,
        string hostVersion = DefaultHostVersion)
    {
        this.allowedExtensionIds = new HashSet<string>(
            allowedExtensionIds ?? new[] { "development-extension" },
            StringComparer.Ordinal);
        IntegrityValid = integrityValid;
        HostVersion = hostVersion;
    }

    public bool IntegrityValid { get; }

    public string HostVersion { get; }

    public HandshakeResultMessage Validate(HandshakeMessage request)
    {
        var extensionIdAllowed = allowedExtensionIds.Contains(request.ExtensionId);
        var protocolCompatible = string.Equals(
            request.ProtocolVersion,
            NativeMessagingProtocol.ProtocolVersion,
            StringComparison.Ordinal);

        var status = protocolCompatible && extensionIdAllowed && IntegrityValid
            ? "ready"
            : "blocked";

        return new HandshakeResultMessage(
            Status: status,
            HostVersion: HostVersion,
            ProtocolVersion: NativeMessagingProtocol.ProtocolVersion,
            ExtensionIdAllowlistStatus: extensionIdAllowed ? "valid" : "invalid",
            IntegrityStatus: IntegrityValid ? "valid" : "invalid");
    }

    public LifecycleResultMessage GetLifecycleResult(HostLifecycleSnapshot snapshot)
    {
        if (!snapshot.HostDetected)
        {
            return new LifecycleResultMessage(
                State: "notDetected",
                HostVersion: null,
                ProtocolVersion: null,
                ExtensionIdAllowlistStatus: "unknown",
                IntegrityStatus: "unknown",
                RecoveryAction: "installCompanion");
        }

        if (!snapshot.ProtocolCompatible)
        {
            return new LifecycleResultMessage(
                State: "incompatible",
                HostVersion: snapshot.HostVersion,
                ProtocolVersion: snapshot.ProtocolVersion,
                ExtensionIdAllowlistStatus: "unknown",
                IntegrityStatus: snapshot.IntegrityValid ? "valid" : "invalid",
                RecoveryAction: "updateCompanion");
        }

        if (!snapshot.ExtensionRegistered)
        {
            return new LifecycleResultMessage(
                State: "registrationFailed",
                HostVersion: snapshot.HostVersion,
                ProtocolVersion: snapshot.ProtocolVersion,
                ExtensionIdAllowlistStatus: "invalid",
                IntegrityStatus: snapshot.IntegrityValid ? "valid" : "invalid",
                RecoveryAction: "installCompanion");
        }

        if (!snapshot.PermissionsAvailable)
        {
            return new LifecycleResultMessage(
                State: "permissionIssue",
                HostVersion: snapshot.HostVersion,
                ProtocolVersion: snapshot.ProtocolVersion,
                ExtensionIdAllowlistStatus: "valid",
                IntegrityStatus: snapshot.IntegrityValid ? "valid" : "invalid",
                RecoveryAction: "retry");
        }

        if (!snapshot.IntegrityValid)
        {
            return new LifecycleResultMessage(
                State: "integrityFailed",
                HostVersion: snapshot.HostVersion,
                ProtocolVersion: snapshot.ProtocolVersion,
                ExtensionIdAllowlistStatus: "valid",
                IntegrityStatus: "invalid",
                RecoveryAction: "updateCompanion");
        }

        return new LifecycleResultMessage(
            State: "ready",
            HostVersion: snapshot.HostVersion,
            ProtocolVersion: snapshot.ProtocolVersion,
            ExtensionIdAllowlistStatus: "valid",
            IntegrityStatus: "valid",
            RecoveryAction: null);
    }
}
