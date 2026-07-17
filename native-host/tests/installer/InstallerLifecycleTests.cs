using System.Text.Json;
using WaTranslator.Diagnostics;
using WaTranslator.Host;
using WaTranslator.Security;
using Xunit;

namespace WaTranslator.NativeHost.InstallerTests;

public sealed class InstallerLifecycleTests
{
    [Fact]
    public void InstallManifestWritesFileRegistersCurrentManifestAndUninstallRemovesBoth()
    {
        var registry = new FakeNativeHostRegistry();
        var registration = new WindowsNativeHostRegistration(registry);
        var rootDirectory = Path.Combine(Path.GetTempPath(), $"wa-translator-installer-{Guid.NewGuid():N}");
        Directory.CreateDirectory(rootDirectory);

        try
        {
            var manifestPath = registration.InstallManifest(rootDirectory, @"C:\Tools\WaTranslator.Host.exe", "development-extension");

            Assert.True(File.Exists(manifestPath));
            Assert.Equal(WindowsNativeHostRegistration.RegistryKeyPath, registry.LastRegisteredKeyPath);
            Assert.Equal(manifestPath, registry.LastRegisteredManifestPath);
            using var manifestDocument = JsonDocument.Parse(File.ReadAllText(manifestPath));
            Assert.Equal("chrome-extension://development-extension/", manifestDocument.RootElement.GetProperty("allowed_origins")[0].GetString());
            Assert.Equal(@"C:\Tools\WaTranslator.Host.exe", manifestDocument.RootElement.GetProperty("path").GetString());

            registration.UninstallManifest(manifestPath);

            Assert.False(File.Exists(manifestPath));
            Assert.Equal(WindowsNativeHostRegistration.RegistryKeyPath, registry.LastDeletedKeyPath);
        }
        finally
        {
            if (Directory.Exists(rootDirectory))
            {
                Directory.Delete(rootDirectory, recursive: true);
            }
        }
    }

    [Fact]
    public void IntegrityServiceFlagsExactVersionMismatchAndDiagnosticsRedactPaths()
    {
        var integrity = new HostIntegrityService();
        var diagnostics = new HostDiagnosticsService();

        var result = integrity.Validate(
            expectedVersion: "1.2.0",
            actualVersion: "1.2.1",
            expectedProtocolVersion: "1.0",
            actualProtocolVersion: "1.0");

        Assert.False(result.IsValid);
        Assert.Equal("HOST_VERSION_MISMATCH", result.ErrorCode);
        Assert.Equal("updateCompanion", result.RecoveryAction);

        var lifecycleEvent = diagnostics.CreateLifecycleEvent(
            "installer.lifecycle",
            new Dictionary<string, string?>
            {
                ["fullExecutablePath"] = @"C:\Program Files\WA Translator\WaTranslator.Host.exe",
                ["rawStderr"] = @"failed at C:\Program Files\WA Translator\WaTranslator.Host.exe token abc123"
            });

        Assert.Equal("WaTranslator.Host.exe", lifecycleEvent.Properties["executableName"]);
        Assert.DoesNotContain(@"C:\Program Files", lifecycleEvent.Properties["sanitizedStderr"], StringComparison.Ordinal);
        Assert.Contains("[redacted-token]", lifecycleEvent.Properties["sanitizedStderr"], StringComparison.Ordinal);
    }

    [Fact]
    public void IntegrityServiceRejectsUnparseableVersionsAsIntegrityFailures()
    {
        var integrity = new HostIntegrityService();

        var result = integrity.Validate(
            expectedVersion: "1.2.0",
            actualVersion: "dev-build",
            expectedProtocolVersion: "1.0",
            actualProtocolVersion: "1.0");

        Assert.False(result.IsValid);
        Assert.Equal("HOST_INTEGRITY_FAILED", result.ErrorCode);
        Assert.Equal("updateCompanion", result.RecoveryAction);
    }

    private sealed class FakeNativeHostRegistry : INativeHostRegistry
    {
        public string? LastRegisteredKeyPath { get; private set; }

        public string? LastRegisteredManifestPath { get; private set; }

        public string? LastDeletedKeyPath { get; private set; }

        public void SetManifestPath(string keyPath, string manifestPath)
        {
            LastRegisteredKeyPath = keyPath;
            LastRegisteredManifestPath = manifestPath;
        }

        public void DeleteRegistration(string keyPath)
        {
            LastDeletedKeyPath = keyPath;
        }
    }
}