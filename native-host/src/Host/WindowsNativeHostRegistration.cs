using Microsoft.Win32;
using System.Runtime.Versioning;
using System.Text.Json;

namespace WaTranslator.Host;

public interface INativeHostRegistry
{
    void SetManifestPath(string keyPath, string manifestPath);
    void DeleteRegistration(string keyPath);
}

[SupportedOSPlatform("windows")]
internal sealed class CurrentUserNativeHostRegistry : INativeHostRegistry
{
    public void SetManifestPath(string keyPath, string manifestPath)
    {
        using var key = Registry.CurrentUser.CreateSubKey(keyPath);
        key?.SetValue(null, manifestPath, RegistryValueKind.String);
    }

    public void DeleteRegistration(string keyPath)
    {
        Registry.CurrentUser.DeleteSubKeyTree(keyPath, throwOnMissingSubKey: false);
    }
}

public sealed class WindowsNativeHostRegistration
{
    public const string ApplicationName = "com.adwcoolgit.wa_translator";
    public const string ManifestName = ApplicationName + ".json";
    public const string RegistryKeyPath = @"Software\Google\Chrome\NativeMessagingHosts\com.adwcoolgit.wa_translator";

    private readonly INativeHostRegistry registry;

    public WindowsNativeHostRegistration(INativeHostRegistry? registry = null)
    {
        this.registry = registry ?? CreateDefaultRegistry();
    }

    private static INativeHostRegistry CreateDefaultRegistry()
    {
        if (!OperatingSystem.IsWindows())
        {
            throw new PlatformNotSupportedException("Native host registration is only supported on Windows.");
        }

        return new CurrentUserNativeHostRegistry();
    }

    public string GetManifestDirectory(string rootDirectory) =>
        Path.Combine(rootDirectory, "Google", "Chrome", "NativeMessagingHosts");

    public string GetManifestPath(string rootDirectory) =>
        Path.Combine(GetManifestDirectory(rootDirectory), ManifestName);

    public string CreateManifest(string hostExecutablePath, string extensionId)
    {
        var manifest = new
        {
            name = ApplicationName,
            description = "WA Translator native messaging host",
            path = hostExecutablePath,
            type = "stdio",
            allowed_origins = new[] { $"chrome-extension://{extensionId}/" }
        };

        return JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
    }

    public string InstallManifest(string rootDirectory, string hostExecutablePath, string extensionId)
    {
        var manifestDirectory = GetManifestDirectory(rootDirectory);
        Directory.CreateDirectory(manifestDirectory);

        var manifestPath = GetManifestPath(rootDirectory);
        File.WriteAllText(manifestPath, CreateManifest(hostExecutablePath, extensionId));
        registry.SetManifestPath(RegistryKeyPath, manifestPath);
        return manifestPath;
    }

    public void UninstallManifest(string manifestPath)
    {
        if (File.Exists(manifestPath))
        {
            File.Delete(manifestPath);
        }

        registry.DeleteRegistration(RegistryKeyPath);
    }
}

