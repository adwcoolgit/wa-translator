using WaTranslator.Host;

namespace WaTranslator.Setup;

public sealed record SetupInstallResult(
    string InstallRoot,
    string HostInstallDirectory,
    string InstalledHostExecutablePath,
    string ManifestPath,
    string RegistryKeyPath,
    string ExtensionId);

public sealed record SetupUninstallResult(
    string InstallRoot,
    string ManifestPath,
    string RegistryKeyPath);

public sealed class NativeHostSetupService
{
    private const string HostDirectoryName = "host";
    private const string HostExecutableName = "WaTranslator.Host.exe";

    private readonly WindowsNativeHostRegistration registration;

    public NativeHostSetupService(WindowsNativeHostRegistration? registration = null)
    {
        this.registration = registration ?? new WindowsNativeHostRegistration();
    }

    public SetupInstallResult Install(string hostSourceDirectory, string installRoot, string extensionId)
    {
        if (string.IsNullOrWhiteSpace(extensionId))
        {
            throw new ArgumentException("Extension ID is required.", nameof(extensionId));
        }

        if (string.IsNullOrWhiteSpace(hostSourceDirectory))
        {
            throw new ArgumentException("Host source directory is required.", nameof(hostSourceDirectory));
        }

        var normalizedSourceDirectory = Path.GetFullPath(hostSourceDirectory);
        if (!Directory.Exists(normalizedSourceDirectory))
        {
            throw new DirectoryNotFoundException($"Host source directory was not found: {normalizedSourceDirectory}");
        }

        var sourceExecutablePath = Path.Combine(normalizedSourceDirectory, HostExecutableName);
        if (!File.Exists(sourceExecutablePath))
        {
            throw new FileNotFoundException(
                $"Host executable was not found in the source directory: {sourceExecutablePath}",
                sourceExecutablePath);
        }

        var normalizedInstallRoot = Path.GetFullPath(installRoot);
        Directory.CreateDirectory(normalizedInstallRoot);

        var hostInstallDirectory = Path.Combine(normalizedInstallRoot, HostDirectoryName);
        var stagingDirectory = Path.Combine(normalizedInstallRoot, $".host-staging-{Guid.NewGuid():N}");

        try
        {
            CopyDirectoryContents(normalizedSourceDirectory, stagingDirectory);

            if (Directory.Exists(hostInstallDirectory))
            {
                Directory.Delete(hostInstallDirectory, recursive: true);
            }

            Directory.Move(stagingDirectory, hostInstallDirectory);
        }
        finally
        {
            if (Directory.Exists(stagingDirectory))
            {
                Directory.Delete(stagingDirectory, recursive: true);
            }
        }

        var installedHostExecutablePath = Path.Combine(hostInstallDirectory, HostExecutableName);
        var manifestPath = registration.InstallManifest(normalizedInstallRoot, installedHostExecutablePath, extensionId.Trim());

        return new SetupInstallResult(
            normalizedInstallRoot,
            hostInstallDirectory,
            installedHostExecutablePath,
            manifestPath,
            WindowsNativeHostRegistration.RegistryKeyPath,
            extensionId.Trim());
    }

    public SetupUninstallResult Uninstall(string installRoot)
    {
        var normalizedInstallRoot = Path.GetFullPath(installRoot);
        var manifestPath = registration.GetManifestPath(normalizedInstallRoot);
        registration.UninstallManifest(manifestPath);

        var hostInstallDirectory = Path.Combine(normalizedInstallRoot, HostDirectoryName);
        if (Directory.Exists(hostInstallDirectory))
        {
            Directory.Delete(hostInstallDirectory, recursive: true);
        }

        DeleteDirectoryIfEmpty(Path.GetDirectoryName(manifestPath), normalizedInstallRoot);
        DeleteDirectoryIfEmpty(normalizedInstallRoot, null);

        return new SetupUninstallResult(
            normalizedInstallRoot,
            manifestPath,
            WindowsNativeHostRegistration.RegistryKeyPath);
    }

    public static string? ResolveDefaultHostSourceDirectory(string baseDirectory)
    {
        var candidates = new[]
        {
            Path.Combine(baseDirectory, HostDirectoryName),
            Path.Combine(baseDirectory, "payload", HostDirectoryName),
            Path.GetFullPath(Path.Combine(baseDirectory, "..", "..", "..", "..", "Host", "bin", "Release", "net8.0"))
        };

        return candidates.FirstOrDefault(Directory.Exists);
    }

    private static void DeleteDirectoryIfEmpty(string? directoryPath, string? stopAtDirectory)
    {
        var currentDirectory = directoryPath;
        while (!string.IsNullOrEmpty(currentDirectory) && Directory.Exists(currentDirectory))
        {
            if (Directory.EnumerateFileSystemEntries(currentDirectory).Any())
            {
                return;
            }

            Directory.Delete(currentDirectory, recursive: false);
            if (!string.IsNullOrEmpty(stopAtDirectory)
                && string.Equals(currentDirectory, stopAtDirectory, StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            currentDirectory = Path.GetDirectoryName(currentDirectory);
        }
    }

    private static void CopyDirectoryContents(string sourceDirectory, string destinationDirectory)
    {
        foreach (var directory in Directory.GetDirectories(sourceDirectory, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(sourceDirectory, directory);
            Directory.CreateDirectory(Path.Combine(destinationDirectory, relativePath));
        }

        foreach (var file in Directory.GetFiles(sourceDirectory, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(sourceDirectory, file);
            var destinationPath = Path.Combine(destinationDirectory, relativePath);
            var destinationParent = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrEmpty(destinationParent))
            {
                Directory.CreateDirectory(destinationParent);
            }

            File.Copy(file, destinationPath, overwrite: true);
        }
    }
}
