using System.Text.Json;
using WaTranslator.Diagnostics;
using WaTranslator.Host;
using WaTranslator.Security;
using WaTranslator.Setup;
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
    public void SetupServiceCopiesHostArtifactsAndRegistersManifest()
    {
        var registry = new FakeNativeHostRegistry();
        var registration = new WindowsNativeHostRegistration(registry);
        var service = new NativeHostSetupService(registration);
        var tempRoot = Path.Combine(Path.GetTempPath(), $"wa-translator-setup-{Guid.NewGuid():N}");
        var sourceDirectory = Path.Combine(tempRoot, "source");
        var nestedDirectory = Path.Combine(sourceDirectory, "runtimes");
        var installRoot = Path.Combine(tempRoot, "install");
        Directory.CreateDirectory(nestedDirectory);
        File.WriteAllText(Path.Combine(sourceDirectory, "WaTranslator.Host.exe"), "host-exe");
        File.WriteAllText(Path.Combine(sourceDirectory, "WaTranslator.Host.dll"), "host-dll");
        File.WriteAllText(Path.Combine(nestedDirectory, "extra.txt"), "runtime-extra");

        try
        {
            var result = service.Install(sourceDirectory, installRoot, "extension-allowed");

            Assert.Equal(Path.Combine(installRoot, "host"), result.HostInstallDirectory);
            Assert.True(File.Exists(result.InstalledHostExecutablePath));
            Assert.True(File.Exists(Path.Combine(result.HostInstallDirectory, "WaTranslator.Host.dll")));
            Assert.True(File.Exists(Path.Combine(result.HostInstallDirectory, "runtimes", "extra.txt")));
            Assert.Equal(WindowsNativeHostRegistration.RegistryKeyPath, registry.LastRegisteredKeyPath);
            Assert.Equal(result.ManifestPath, registry.LastRegisteredManifestPath);

            using var manifestDocument = JsonDocument.Parse(File.ReadAllText(result.ManifestPath));
            Assert.Equal(result.InstalledHostExecutablePath, manifestDocument.RootElement.GetProperty("path").GetString());
            Assert.Equal("chrome-extension://extension-allowed/", manifestDocument.RootElement.GetProperty("allowed_origins")[0].GetString());
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public void SetupServiceReplacesExistingHostDirectoryWithoutLeavingStaleFiles()
    {
        var registry = new FakeNativeHostRegistry();
        var registration = new WindowsNativeHostRegistration(registry);
        var service = new NativeHostSetupService(registration);
        var tempRoot = Path.Combine(Path.GetTempPath(), $"wa-translator-setup-upgrade-{Guid.NewGuid():N}");
        var originalSourceDirectory = Path.Combine(tempRoot, "source-v1");
        var upgradedSourceDirectory = Path.Combine(tempRoot, "source-v2");
        var installRoot = Path.Combine(tempRoot, "install");
        Directory.CreateDirectory(originalSourceDirectory);
        Directory.CreateDirectory(upgradedSourceDirectory);
        File.WriteAllText(Path.Combine(originalSourceDirectory, "WaTranslator.Host.exe"), "host-exe-v1");
        File.WriteAllText(Path.Combine(originalSourceDirectory, "legacy.txt"), "legacy");
        File.WriteAllText(Path.Combine(upgradedSourceDirectory, "WaTranslator.Host.exe"), "host-exe-v2");
        File.WriteAllText(Path.Combine(upgradedSourceDirectory, "WaTranslator.Host.dll"), "host-dll-v2");

        try
        {
            var initialInstall = service.Install(originalSourceDirectory, installRoot, "extension-allowed");
            Assert.True(File.Exists(Path.Combine(initialInstall.HostInstallDirectory, "legacy.txt")));

            var upgradedInstall = service.Install(upgradedSourceDirectory, installRoot, "extension-allowed");

            Assert.False(File.Exists(Path.Combine(upgradedInstall.HostInstallDirectory, "legacy.txt")));
            Assert.Equal("host-exe-v2", File.ReadAllText(upgradedInstall.InstalledHostExecutablePath));
            Assert.True(File.Exists(Path.Combine(upgradedInstall.HostInstallDirectory, "WaTranslator.Host.dll")));
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public void SetupServiceRejectsMissingHostExecutable()
    {
        var registry = new FakeNativeHostRegistry();
        var service = new NativeHostSetupService(new WindowsNativeHostRegistration(registry));
        var tempRoot = Path.Combine(Path.GetTempPath(), $"wa-translator-setup-missing-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempRoot);

        try
        {
            var exception = Assert.Throws<FileNotFoundException>(() =>
                service.Install(tempRoot, Path.Combine(tempRoot, "install"), "extension-allowed"));

            Assert.Contains("WaTranslator.Host.exe", exception.Message, StringComparison.Ordinal);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public void SetupServiceUninstallRemovesManifestRegistrationAndHostPayload()
    {
        var registry = new FakeNativeHostRegistry();
        var registration = new WindowsNativeHostRegistration(registry);
        var service = new NativeHostSetupService(registration);
        var tempRoot = Path.Combine(Path.GetTempPath(), $"wa-translator-uninstall-{Guid.NewGuid():N}");
        var sourceDirectory = Path.Combine(tempRoot, "source");
        var installRoot = Path.Combine(tempRoot, "install");
        Directory.CreateDirectory(sourceDirectory);
        File.WriteAllText(Path.Combine(sourceDirectory, "WaTranslator.Host.exe"), "host-exe");

        try
        {
            var installResult = service.Install(sourceDirectory, installRoot, "extension-allowed");
            Assert.True(File.Exists(installResult.ManifestPath));
            Assert.True(Directory.Exists(installResult.HostInstallDirectory));

            var uninstallResult = service.Uninstall(installRoot);

            Assert.Equal(installResult.ManifestPath, uninstallResult.ManifestPath);
            Assert.False(File.Exists(installResult.ManifestPath));
            Assert.False(Directory.Exists(installResult.HostInstallDirectory));
            Assert.Equal(WindowsNativeHostRegistration.RegistryKeyPath, registry.LastDeletedKeyPath);
        }
        finally
        {
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
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

