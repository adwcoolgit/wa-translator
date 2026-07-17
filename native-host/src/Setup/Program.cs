namespace WaTranslator.Setup;

internal static class Program
{
    private static int Main(string[] args)
    {
        if (!SetupCommandParser.TryParse(args, out var command, out var error))
        {
            WriteError(error ?? "Invalid arguments.");
            WriteUsage();
            return 1;
        }

        if (command is null)
        {
            WriteError("No setup command was produced.");
            return 1;
        }

        if (string.Equals(command.Operation, "help", StringComparison.Ordinal))
        {
            WriteUsage();
            return 0;
        }

        try
        {
            var service = new NativeHostSetupService();

            if (string.Equals(command.Operation, "uninstall", StringComparison.Ordinal))
            {
                var uninstallResult = service.Uninstall(command.InstallRoot);
                Console.WriteLine("WA Translator setup uninstall selesai.");
                Console.WriteLine($"Install root : {uninstallResult.InstallRoot}");
                Console.WriteLine($"Manifest     : {uninstallResult.ManifestPath}");
                Console.WriteLine($"Registry key : HKCU\\{uninstallResult.RegistryKeyPath}");
                return 0;
            }

            var hostSourceDirectory = command.HostSourceDirectory
                ?? NativeHostSetupService.ResolveDefaultHostSourceDirectory(AppContext.BaseDirectory);
            if (string.IsNullOrWhiteSpace(hostSourceDirectory))
            {
                WriteError("Host source directory could not be resolved automatically. Use --host-source.");
                return 1;
            }

            var extensionId = command.ExtensionId;
            if (string.IsNullOrWhiteSpace(extensionId) && command.PromptForMissingExtensionId)
            {
                Console.Write("Masukkan Chrome Extension ID: ");
                extensionId = Console.ReadLine();
            }

            if (string.IsNullOrWhiteSpace(extensionId))
            {
                WriteError("Chrome Extension ID is required. Provide --extension-id or run interactively.");
                return 1;
            }

            var installResult = service.Install(hostSourceDirectory, command.InstallRoot, extensionId);
            Console.WriteLine("WA Translator setup install selesai.");
            Console.WriteLine($"Install root : {installResult.InstallRoot}");
            Console.WriteLine($"Host source  : {Path.GetFullPath(hostSourceDirectory)}");
            Console.WriteLine($"Host exe     : {installResult.InstalledHostExecutablePath}");
            Console.WriteLine($"Manifest     : {installResult.ManifestPath}");
            Console.WriteLine($"Registry key : HKCU\\{installResult.RegistryKeyPath}");
            Console.WriteLine($"Extension ID : {installResult.ExtensionId}");
            Console.WriteLine();
            Console.WriteLine("Langkah berikutnya:");
            Console.WriteLine("1. Pastikan extension WA Translator sudah di-load di chrome://extensions/.");
            Console.WriteLine("2. Buka onboarding extension.");
            Console.WriteLine("3. Jalankan synthetic provider health check.");
            return 0;
        }
        catch (Exception exception)
        {
            WriteError(exception.Message);
            return 1;
        }
    }

    private static void WriteUsage()
    {
        Console.WriteLine("WA Translator Setup");
        Console.WriteLine();
        Console.WriteLine("Usage:");
        Console.WriteLine("  WaTranslator.Setup.exe install [--extension-id <id>] [--host-source <dir>] [--install-root <dir>] [--no-prompt]");
        Console.WriteLine("  WaTranslator.Setup.exe uninstall [--install-root <dir>]");
        Console.WriteLine();
        Console.WriteLine("Default install root:");
        Console.WriteLine($"  {SetupCommand.DefaultInstallRoot}");
    }

    private static void WriteError(string message)
    {
        Console.Error.WriteLine($"ERROR: {message}");
    }
}
