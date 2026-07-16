namespace WaTranslator.Security;

internal sealed record SafeExecutionProfile(
    string Name,
    string WorkingDirectoryMode,
    bool DisableShellInterpolation,
    bool DisableFilesystemAccess,
    bool DisableBrowserAccess,
    bool DisablePluginAccess,
    bool DisableSessionResume,
    IReadOnlyList<string> AllowedEnvironmentVariables)
{
    public static SafeExecutionProfile TranslationOnly { get; } = new(
        Name: "translation-only",
        WorkingDirectoryMode: "emptyTemporaryDirectory",
        DisableShellInterpolation: true,
        DisableFilesystemAccess: true,
        DisableBrowserAccess: true,
        DisablePluginAccess: true,
        DisableSessionResume: true,
        AllowedEnvironmentVariables: new[]
        {
            "PATH",
            "SystemRoot",
            "TEMP",
            "TMP"
        });

    public void Validate()
    {
        if (!DisableShellInterpolation)
        {
            throw new InvalidOperationException("Shell interpolation must remain disabled.");
        }

        if (!DisableFilesystemAccess || !DisableBrowserAccess || !DisablePluginAccess || !DisableSessionResume)
        {
            throw new InvalidOperationException("Translation-only profile must disable non-translation runtime capabilities.");
        }

        if (!string.Equals(WorkingDirectoryMode, "emptyTemporaryDirectory", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Working directory mode must be the empty temporary directory profile.");
        }
    }
}
