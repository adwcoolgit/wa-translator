namespace WaTranslator.Setup;

public static class SetupCommandParser
{
    public static bool TryParse(string[] args, out SetupCommand? command, out string? error)
    {
        command = null;
        error = null;

        var operation = "install";
        string? installRoot = null;
        string? hostSourceDirectory = null;
        string? extensionId = null;
        var promptForMissingExtensionId = true;

        var index = 0;
        if (args.Length > 0 && !args[0].StartsWith("--", StringComparison.Ordinal))
        {
            operation = args[0].Trim().ToLowerInvariant();
            index = 1;
        }

        for (; index < args.Length; index += 1)
        {
            var argument = args[index];
            switch (argument)
            {
                case "--install-root":
                    if (!TryReadValue(args, ref index, out installRoot, out error))
                    {
                        return false;
                    }
                    break;
                case "--host-source":
                    if (!TryReadValue(args, ref index, out hostSourceDirectory, out error))
                    {
                        return false;
                    }
                    break;
                case "--extension-id":
                    if (!TryReadValue(args, ref index, out extensionId, out error))
                    {
                        return false;
                    }
                    break;
                case "--no-prompt":
                    promptForMissingExtensionId = false;
                    break;
                case "--help":
                case "-h":
                case "/?":
                    command = new SetupCommand("help", SetupCommand.DefaultInstallRoot, null, null, false);
                    return true;
                default:
                    error = $"Unsupported argument '{argument}'.";
                    return false;
            }
        }

        if (!string.Equals(operation, "install", StringComparison.Ordinal)
            && !string.Equals(operation, "uninstall", StringComparison.Ordinal)
            && !string.Equals(operation, "help", StringComparison.Ordinal))
        {
            error = $"Unsupported operation '{operation}'. Use 'install', 'uninstall', or 'help'.";
            return false;
        }

        command = new SetupCommand(
            operation,
            string.IsNullOrWhiteSpace(installRoot) ? SetupCommand.DefaultInstallRoot : installRoot.Trim(),
            string.IsNullOrWhiteSpace(hostSourceDirectory) ? null : hostSourceDirectory.Trim(),
            string.IsNullOrWhiteSpace(extensionId) ? null : extensionId.Trim(),
            promptForMissingExtensionId);
        return true;
    }

    private static bool TryReadValue(string[] args, ref int index, out string? value, out string? error)
    {
        value = null;
        error = null;

        if (index + 1 >= args.Length)
        {
            error = $"Missing value for '{args[index]}'.";
            return false;
        }

        value = args[index + 1];
        index += 1;
        return true;
    }
}
