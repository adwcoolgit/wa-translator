using System.Text.Json;
using WaTranslator.Host;
using WaTranslator.Host.Protocol;
using Xunit;

namespace WaTranslator.NativeHost.IntegrationTests;

public sealed class HostLifecycleTests
{
    private readonly HandshakeService handshakeService = new(new[] { "extension-allowed" });

    [Fact]
    public void MissingHostMapsToNotDetectedLifecycleState()
    {
        var lifecycle = handshakeService.GetLifecycleResult(new HostLifecycleSnapshot(HostDetected: false));

        Assert.Equal("notDetected", lifecycle.State);
        Assert.Equal("installCompanion", lifecycle.RecoveryAction);
    }

    [Fact]
    public void OutdatedHostMapsToIncompatibleLifecycleState()
    {
        var lifecycle = handshakeService.GetLifecycleResult(new HostLifecycleSnapshot(ProtocolCompatible: false));

        Assert.Equal("incompatible", lifecycle.State);
        Assert.Equal("updateCompanion", lifecycle.RecoveryAction);
    }

    [Fact]
    public void RegistrationFailureMapsToRegistrationFailedLifecycleState()
    {
        var lifecycle = handshakeService.GetLifecycleResult(new HostLifecycleSnapshot(ExtensionRegistered: false));

        Assert.Equal("registrationFailed", lifecycle.State);
        Assert.Equal("installCompanion", lifecycle.RecoveryAction);
    }

    [Fact]
    public void UnavailableHostMapsToPermissionIssueLifecycleState()
    {
        var lifecycle = handshakeService.GetLifecycleResult(new HostLifecycleSnapshot(PermissionsAvailable: false));

        Assert.Equal("permissionIssue", lifecycle.State);
        Assert.Equal("retry", lifecycle.RecoveryAction);
    }

    [Fact]
    public void ReadyHostRoundTripsThroughNativeMessagingFrame()
    {
        var handshake = handshakeService.Validate(new HandshakeMessage(
            ExtensionVersion: "0.0.0-dev",
            ProtocolVersion: NativeMessagingProtocol.ProtocolVersion,
            ExtensionId: "extension-allowed"));
        var lifecycle = handshakeService.GetLifecycleResult(new HostLifecycleSnapshot());

        var frame = NativeMessagingHarness.FrameJson(lifecycle);
        var json = NativeMessagingHarness.ReadFrame(frame);
        var parsed = JsonSerializer.Deserialize<LifecycleResultMessage>(json, NativeMessagingProtocol.JsonOptions);

        Assert.NotNull(parsed);
        Assert.Equal("ready", handshake.Status);
        Assert.Equal("ready", parsed!.State);
        Assert.Equal("valid", parsed.ExtensionIdAllowlistStatus);
    }
}
