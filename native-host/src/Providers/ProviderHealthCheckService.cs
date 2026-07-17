using System.Diagnostics;
using System.Text.Json.Serialization;
using WaTranslator.Security;

namespace WaTranslator.Providers;

public sealed record ProviderHealthCheckRequest(
    string RequestId,
    string Provider,
    string SyntheticText,
    string SourceLanguage,
    string TargetLanguage,
    int TimeoutSeconds);

public sealed record ProviderHealthError(
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("component")] string Component,
    [property: JsonPropertyName("severity")] string Severity,
    [property: JsonPropertyName("recoveryAction")] string RecoveryAction,
    [property: JsonPropertyName("supportCode")] string SupportCode);

public sealed record ProviderHealthCheckResult(
    [property: JsonPropertyName("contractVersion")] string ContractVersion,
    [property: JsonPropertyName("requestId")] string RequestId,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("translation")] string? Translation,
    [property: JsonPropertyName("detectedSourceLanguage")] string? DetectedSourceLanguage,
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("latencyMs")] int LatencyMs,
    [property: JsonPropertyName("error")] ProviderHealthError? Error);

public sealed record ProviderProbeCommand(
    string Provider,
    string ExecutablePath,
    string WorkingDirectory,
    string Prompt,
    string? OutputFilePath,
    int TimeoutSeconds,
    IReadOnlyList<string> Arguments);

public sealed record ProviderProbeExecutionResult(
    int ExitCode,
    bool TimedOut,
    string StandardOutput,
    string StandardError,
    string? OutputText);

public delegate ProviderProbeExecutionResult ProviderProbeRunner(
    ProviderProbeCommand command,
    CancellationToken cancellationToken);

public sealed class ProviderHealthCheckService
{
    private readonly ProviderProbeRunner probeRunner;

    public ProviderHealthCheckService(ProviderProbeRunner? probeRunner = null)
    {
        this.probeRunner = probeRunner ?? RunProbe;
    }

    public ProviderHealthCheckResult Run(
        ProviderHealthCheckRequest request,
        CancellationToken cancellationToken = default)
    {
        SafeExecutionProfile.TranslationOnly.Validate();

        var startedAt = Stopwatch.GetTimestamp();
        var provider = request.Provider.Trim().ToLowerInvariant();
        var overrideState = GetOverrideState(provider);

        if (!string.IsNullOrWhiteSpace(overrideState))
        {
            return CreateOverriddenResult(request, provider, overrideState!, startedAt);
        }

        if (!TryResolveExecutable(provider, out var executablePath))
        {
            return CreateErrorResult(
                request,
                provider,
                "PROVIDER_NOT_FOUND",
                "selectExecutable",
                startedAt);
        }

        cancellationToken.ThrowIfCancellationRequested();

        var workingDirectory = Path.Combine(Path.GetTempPath(), $"wa-translator-health-{Guid.NewGuid():N}");
        Directory.CreateDirectory(workingDirectory);

        try
        {
            var probeCommand = BuildProbeCommand(request, provider, executablePath!, workingDirectory);
            var execution = this.probeRunner(probeCommand, cancellationToken);

            if (execution.TimedOut)
            {
                return CreateErrorResult(request, provider, "PROVIDER_TIMEOUT", "retry", startedAt);
            }

            var translatedText = execution.OutputText?.Trim();
            if (execution.ExitCode == 0 && !string.IsNullOrWhiteSpace(translatedText))
            {
                return new ProviderHealthCheckResult(
                    ContractVersion: "1.0",
                    RequestId: request.RequestId,
                    Status: "success",
                    Translation: translatedText,
                    DetectedSourceLanguage: string.Equals(request.SourceLanguage, "auto", StringComparison.OrdinalIgnoreCase)
                        ? null
                        : request.SourceLanguage,
                    Provider: provider,
                    LatencyMs: ToLatency(startedAt),
                    Error: null);
            }

            return CreateFailureResultFromExecution(request, provider, execution, startedAt);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            return CreateFailureResultFromException(request, provider, exception, startedAt);
        }
        finally
        {
            TryDeleteDirectory(workingDirectory);
        }
    }

    private static ProviderProbeCommand BuildProbeCommand(
        ProviderHealthCheckRequest request,
        string provider,
        string executablePath,
        string workingDirectory)
    {
        var prompt = BuildSyntheticPrompt(request);
        var arguments = provider switch
        {
            "codex" => BuildCodexArguments(prompt, workingDirectory, out var codexOutputPath),
            "claude" => BuildClaudeArguments(prompt),
            _ => throw new InvalidOperationException($"Unsupported provider '{provider}'.")
        };

        var outputFilePath = provider == "codex" ? Path.Combine(workingDirectory, "codex-last-message.txt") : null;

        return new ProviderProbeCommand(
            Provider: provider,
            ExecutablePath: executablePath,
            WorkingDirectory: workingDirectory,
            Prompt: prompt,
            OutputFilePath: outputFilePath,
            TimeoutSeconds: request.TimeoutSeconds,
            Arguments: arguments);
    }

    private static IReadOnlyList<string> BuildCodexArguments(
        string prompt,
        string workingDirectory,
        out string outputFilePath)
    {
        outputFilePath = Path.Combine(workingDirectory, "codex-last-message.txt");

        return new[]
        {
            "exec",
            "--skip-git-repo-check",
            "--ephemeral",
            "--ignore-rules",
            "--sandbox",
            "read-only",
            "--color",
            "never",
            "-C",
            workingDirectory,
            "-o",
            outputFilePath,
            prompt
        };
    }

    private static IReadOnlyList<string> BuildClaudeArguments(string prompt) =>
        new[]
        {
            "--print",
            "--output-format",
            "text",
            "--safe-mode",
            "--no-session-persistence",
            "--tools",
            string.Empty,
            prompt
        };

    private static string BuildSyntheticPrompt(ProviderHealthCheckRequest request)
    {
        var sourceInstruction = string.Equals(request.SourceLanguage, "auto", StringComparison.OrdinalIgnoreCase)
            ? "Auto-detect the source language."
            : $"Treat the source language as {request.SourceLanguage}.";

        return $"""
This is a synthetic health-check translation for WA Translator.
{sourceInstruction}
Translate the sentence below into {request.TargetLanguage}.
Return only the translated sentence with no commentary, markdown, quotes, or extra labels.

Sentence:
{request.SyntheticText}
""";
    }

    private static ProviderProbeExecutionResult RunProbe(
        ProviderProbeCommand command,
        CancellationToken cancellationToken)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = command.ExecutablePath,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            WorkingDirectory = command.WorkingDirectory
        };

        foreach (var argument in command.Arguments)
        {
            process.StartInfo.ArgumentList.Add(argument);
        }

        ConfigureEnvironment(process.StartInfo.Environment);

        cancellationToken.ThrowIfCancellationRequested();
        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync();
        var stderrTask = process.StandardError.ReadToEndAsync();

        using var registration = cancellationToken.Register(() => TryKillProcess(process));

        if (!process.WaitForExit(command.TimeoutSeconds * 1000))
        {
            TryKillProcess(process);
            process.WaitForExit();
            Task.WaitAll(stdoutTask, stderrTask);
            return new ProviderProbeExecutionResult(
                ExitCode: -1,
                TimedOut: true,
                StandardOutput: stdoutTask.Result,
                StandardError: stderrTask.Result,
                OutputText: null);
        }

        process.WaitForExit();
        Task.WaitAll(stdoutTask, stderrTask);

        var outputText = ReadProbeOutput(command.OutputFilePath, stdoutTask.Result);
        return new ProviderProbeExecutionResult(
            ExitCode: process.ExitCode,
            TimedOut: false,
            StandardOutput: stdoutTask.Result,
            StandardError: stderrTask.Result,
            OutputText: outputText);
    }

    private static void ConfigureEnvironment(System.Collections.Generic.IDictionary<string, string?> environment)
    {
        environment.Clear();

        foreach (var variableName in SafeExecutionProfile.TranslationOnly.AllowedEnvironmentVariables)
        {
            var value = Environment.GetEnvironmentVariable(variableName);
            if (!string.IsNullOrWhiteSpace(value))
            {
                environment[variableName] = value;
            }
        }
    }

    private static string? ReadProbeOutput(string? outputFilePath, string standardOutput)
    {
        if (!string.IsNullOrWhiteSpace(outputFilePath) && File.Exists(outputFilePath))
        {
            var fileOutput = File.ReadAllText(outputFilePath).Trim();
            if (!string.IsNullOrWhiteSpace(fileOutput))
            {
                return fileOutput;
            }
        }

        var stdout = standardOutput.Trim();
        return string.IsNullOrWhiteSpace(stdout) ? null : stdout;
    }

    private static void TryKillProcess(Process process)
    {
        if (process.HasExited)
        {
            return;
        }

        process.Kill(entireProcessTree: true);
    }

    private static ProviderHealthCheckResult CreateFailureResultFromExecution(
        ProviderHealthCheckRequest request,
        string provider,
        ProviderProbeExecutionResult execution,
        long startedAt)
    {
        var combinedOutput = $"{execution.StandardError}\n{execution.StandardOutput}\n{execution.OutputText}".Trim();

        if (ContainsAny(combinedOutput, "sign in", "sign-in", "log in", "login", "authenticate", "authentication", "not authenticated", "setup-token"))
        {
            return CreateErrorResult(request, provider, "PROVIDER_AUTH_REQUIRED", "signInWithCli", startedAt);
        }

        if (ContainsAny(combinedOutput, "rate limit", "too many requests", "quota", "overloaded"))
        {
            return CreateErrorResult(request, provider, "PROVIDER_RATE_LIMIT", "retry", startedAt);
        }

        if (ContainsAny(combinedOutput, "access is denied", "permission denied", "sandbox", "unsafe"))
        {
            return CreateErrorResult(request, provider, "PROVIDER_UNSAFE_CONFIGURATION", "openDiagnostics", startedAt);
        }

        return CreateErrorResult(request, provider, "PROVIDER_INVALID_OUTPUT", "openDiagnostics", startedAt);
    }

    private static ProviderHealthCheckResult CreateFailureResultFromException(
        ProviderHealthCheckRequest request,
        string provider,
        Exception exception,
        long startedAt)
    {
        var message = exception.Message.ToLowerInvariant();

        if (message.Contains("cannot find") || message.Contains("not found"))
        {
            return CreateErrorResult(request, provider, "PROVIDER_NOT_FOUND", "selectExecutable", startedAt);
        }

        if (message.Contains("access is denied") || message.Contains("permission denied"))
        {
            return CreateErrorResult(request, provider, "PROVIDER_UNSAFE_CONFIGURATION", "openDiagnostics", startedAt);
        }

        return CreateErrorResult(request, provider, "PROVIDER_INVALID_OUTPUT", "openDiagnostics", startedAt);
    }

    private static string? GetOverrideState(string provider)
    {
        var variableName = $"WA_TRANSLATOR_{provider.ToUpperInvariant()}_HEALTH_STATE";
        var value = Environment.GetEnvironmentVariable(variableName);
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ProviderHealthCheckResult CreateOverriddenResult(
        ProviderHealthCheckRequest request,
        string provider,
        string state,
        long startedAt)
    {
        return state.ToLowerInvariant() switch
        {
            "authrequired" => CreateErrorResult(request, provider, "PROVIDER_AUTH_REQUIRED", "signInWithCli", startedAt),
            "timeout" => CreateErrorResult(request, provider, "PROVIDER_TIMEOUT", "retry", startedAt),
            "ratelimited" => CreateErrorResult(request, provider, "PROVIDER_RATE_LIMIT", "retry", startedAt),
            "unsafeconfiguration" => CreateErrorResult(request, provider, "PROVIDER_UNSAFE_CONFIGURATION", "openDiagnostics", startedAt),
            "invalidoutput" => CreateErrorResult(request, provider, "PROVIDER_INVALID_OUTPUT", "openDiagnostics", startedAt),
            _ => CreateErrorResult(request, provider, "PROVIDER_NOT_FOUND", "selectExecutable", startedAt)
        };
    }

    private static ProviderHealthCheckResult CreateErrorResult(
        ProviderHealthCheckRequest request,
        string provider,
        string errorCode,
        string recoveryAction,
        long startedAt)
    {
        return new ProviderHealthCheckResult(
            ContractVersion: "1.0",
            RequestId: request.RequestId,
            Status: "error",
            Translation: null,
            DetectedSourceLanguage: null,
            Provider: provider,
            LatencyMs: ToLatency(startedAt),
            Error: new ProviderHealthError(
                Code: errorCode,
                Component: "provider",
                Severity: errorCode is "PROVIDER_TIMEOUT" or "PROVIDER_RATE_LIMIT" ? "warning" : "blocking",
                RecoveryAction: recoveryAction,
                SupportCode: errorCode));
    }

    private static int ToLatency(long startedAt)
    {
        var elapsed = Stopwatch.GetElapsedTime(startedAt);
        return (int)Math.Max(0, elapsed.TotalMilliseconds);
    }

    private static bool TryResolveExecutable(string provider, out string? executablePath)
    {
        var overrideVariableName = $"WA_TRANSLATOR_{provider.ToUpperInvariant()}_EXECUTABLE";
        var overrideExecutable = Environment.GetEnvironmentVariable(overrideVariableName);
        if (!string.IsNullOrWhiteSpace(overrideExecutable))
        {
            executablePath = overrideExecutable.Trim();
            return true;
        }

        var executableNames = provider switch
        {
            "codex" => new[] { "codex.exe", "codex.cmd", "codex.bat", "codex" },
            "claude" => new[] { "claude.exe", "claude.cmd", "claude.bat", "claude" },
            _ => Array.Empty<string>()
        };

        var pathValue = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        var directories = pathValue.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var directory in directories)
        {
            foreach (var executableName in executableNames)
            {
                var candidate = Path.Combine(directory, executableName);
                if (File.Exists(candidate))
                {
                    executablePath = candidate;
                    return true;
                }
            }
        }

        executablePath = null;
        return false;
    }

    private static bool ContainsAny(string value, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (value.Contains(candidate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void TryDeleteDirectory(string workingDirectory)
    {
        try
        {
            if (Directory.Exists(workingDirectory))
            {
                Directory.Delete(workingDirectory, recursive: true);
            }
        }
        catch
        {
            // Cleanup should not change the result of the health check.
        }
    }
}

