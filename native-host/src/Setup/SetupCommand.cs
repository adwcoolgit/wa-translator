namespace WaTranslator.Setup;

public sealed record SetupCommand(
    string Operation,
    string InstallRoot,
    string? HostSourceDirectory,
    string? ExtensionId,
    bool PromptForMissingExtensionId)
{
    public static readonly string DefaultInstallRoot = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "WA Translator");
}
