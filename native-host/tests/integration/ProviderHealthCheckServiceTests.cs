using WaTranslator.Providers;
using Xunit;

namespace WaTranslator.NativeHost.IntegrationTests;

public sealed class ProviderHealthCheckServiceTests
{
    [Fact]
    public void RunReturnsSuccessWhenProbeProducesSyntheticTranslation()
    {
        const string variableName = "WA_TRANSLATOR_CODEX_EXECUTABLE";
        var previousValue = Environment.GetEnvironmentVariable(variableName);
        Environment.SetEnvironmentVariable(variableName, "codex-test-double");

        try
        {
            var service = new ProviderHealthCheckService((command, _) =>
            {
                Assert.Equal("codex", command.Provider);
                Assert.Contains("synthetic health-check translation", command.Prompt, StringComparison.OrdinalIgnoreCase);
                Assert.Contains("WA Translator synthetic health check.", command.Prompt, StringComparison.Ordinal);

                return new ProviderProbeExecutionResult(
                    ExitCode: 0,
                    TimedOut: false,
                    StandardOutput: string.Empty,
                    StandardError: string.Empty,
                    OutputText: "Tes sintetis berhasil.");
            });

            var result = service.Run(new ProviderHealthCheckRequest(
                RequestId: "health-codex-1",
                Provider: "codex",
                SyntheticText: "WA Translator synthetic health check.",
                SourceLanguage: "en",
                TargetLanguage: "id",
                TimeoutSeconds: 15));

            Assert.Equal("success", result.Status);
            Assert.Equal("codex", result.Provider);
            Assert.Equal("Tes sintetis berhasil.", result.Translation);
            Assert.Null(result.Error);
        }
        finally
        {
            Environment.SetEnvironmentVariable(variableName, previousValue);
        }
    }

    [Fact]
    public void RunReturnsAuthRequiredWhenProbeRequestsCliSignIn()
    {
        const string variableName = "WA_TRANSLATOR_CLAUDE_EXECUTABLE";
        var previousValue = Environment.GetEnvironmentVariable(variableName);
        Environment.SetEnvironmentVariable(variableName, "claude-test-double");

        try
        {
            var service = new ProviderHealthCheckService((_, _) =>
                new ProviderProbeExecutionResult(
                    ExitCode: 1,
                    TimedOut: false,
                    StandardOutput: string.Empty,
                    StandardError: "Please sign in to Claude Code before running this command.",
                    OutputText: null));

            var result = service.Run(new ProviderHealthCheckRequest(
                RequestId: "health-claude-1",
                Provider: "claude",
                SyntheticText: "WA Translator synthetic health check.",
                SourceLanguage: "en",
                TargetLanguage: "id",
                TimeoutSeconds: 15));

            Assert.Equal("error", result.Status);
            Assert.NotNull(result.Error);
            Assert.Equal("PROVIDER_AUTH_REQUIRED", result.Error!.Code);
            Assert.Equal("signInWithCli", result.Error.RecoveryAction);
        }
        finally
        {
            Environment.SetEnvironmentVariable(variableName, previousValue);
        }
    }
}
