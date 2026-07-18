using System.Buffers.Binary;
using System.Text.Json;
using WaTranslator.Host.Protocol;
using WaTranslator.Providers;

namespace WaTranslator.Host;

internal static class Program
{
    private static readonly HandshakeService HandshakeService = new();
    private static readonly ProviderHealthCheckService ProviderHealthCheckService = new();
    private static readonly TranslationMessageHandler TranslationMessageHandler = new();

    private static int Main()
    {
        using var input = Console.OpenStandardInput();
        using var output = Console.OpenStandardOutput();

        while (TryReadFrame(input, out var json))
        {
            var response = Dispatch(json);
            WriteFrame(output, response);
        }

        return 0;
    }

    private static string Dispatch(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        var type = root.GetProperty("type").GetString();

        return type switch
        {
            "handshake" => HandleHandshake(root),
            "lifecycleQuery" => HandleLifecycleQuery(),
            "providerHealthCheckRequest" => HandleProviderHealthCheckRequest(root),
            "translationRequest" => HandleTranslationRequest(root),
            _ => JsonSerializer.Serialize(
                new ErrorMessage(NativeMessagingProtocol.ProtocolVersion, "UNKNOWN_MESSAGE", "Unsupported native message type."),
                NativeMessagingProtocol.JsonOptions)
        };
    }

    private static string HandleHandshake(JsonElement root)
    {
        var request = JsonSerializer.Deserialize<HandshakeMessage>(root.GetRawText(), NativeMessagingProtocol.JsonOptions)
            ?? throw new InvalidOperationException("Handshake payload is required.");
        var response = HandshakeService.Validate(request);
        return JsonSerializer.Serialize(response, NativeMessagingProtocol.JsonOptions);
    }

    private static string HandleLifecycleQuery()
    {
        var response = HandshakeService.GetLifecycleResult(new HostLifecycleSnapshot());
        return JsonSerializer.Serialize(response, NativeMessagingProtocol.JsonOptions);
    }

    private static string HandleProviderHealthCheckRequest(JsonElement root)
    {
        var request = JsonSerializer.Deserialize<ProviderHealthCheckRequestMessage>(root.GetRawText(), NativeMessagingProtocol.JsonOptions)
            ?? throw new InvalidOperationException("Provider health-check request payload is required.");
        var payload = request.Payload;
        var providerRequest = new ProviderHealthCheckRequest(
            RequestId: payload.GetProperty("requestId").GetString() ?? "health-request",
            Provider: payload.GetProperty("provider").GetString() ?? "codex",
            SyntheticText: payload.GetProperty("syntheticText").GetString() ?? string.Empty,
            SourceLanguage: payload.GetProperty("sourceLanguage").GetString() ?? "auto",
            TargetLanguage: payload.GetProperty("targetLanguage").GetString() ?? "id",
            ExecutablePathOverride: payload.TryGetProperty("executablePathOverride", out var executableOverrideElement) ? executableOverrideElement.GetString() : null,
            TimeoutSeconds: payload.TryGetProperty("timeoutSeconds", out var timeoutElement) ? timeoutElement.GetInt32() : 30);

        var result = ProviderHealthCheckService.Run(providerRequest);
        var response = new ProviderHealthCheckResultMessage(
            NativeMessagingProtocol.ProtocolVersion,
            JsonSerializer.SerializeToElement(result, NativeMessagingProtocol.JsonOptions));

        return JsonSerializer.Serialize(response, NativeMessagingProtocol.JsonOptions);
    }

    private static string HandleTranslationRequest(JsonElement root)
    {
        var request = JsonSerializer.Deserialize<TranslationRequestMessage>(root.GetRawText(), NativeMessagingProtocol.JsonOptions)
            ?? throw new InvalidOperationException("Translation request payload is required.");
        var result = TranslationMessageHandler.Execute(request.Payload);
        var response = new TranslationResponseMessage(
            NativeMessagingProtocol.ProtocolVersion,
            JsonSerializer.SerializeToElement(result, NativeMessagingProtocol.JsonOptions));

        return JsonSerializer.Serialize(response, NativeMessagingProtocol.JsonOptions);
    }

    private static bool TryReadFrame(Stream input, out string json)
    {
        json = string.Empty;
        Span<byte> lengthBuffer = stackalloc byte[4];
        if (!TryReadExact(input, lengthBuffer))
        {
            return false;
        }

        var messageLength = BinaryPrimitives.ReadInt32LittleEndian(lengthBuffer);
        if (messageLength <= 0)
        {
            return false;
        }

        var bodyBuffer = new byte[messageLength];
        if (!TryReadExact(input, bodyBuffer))
        {
            return false;
        }

        json = System.Text.Encoding.UTF8.GetString(bodyBuffer);
        return true;
    }

    private static bool TryReadExact(Stream input, Span<byte> buffer)
    {
        var totalRead = 0;
        while (totalRead < buffer.Length)
        {
            var bytesRead = input.Read(buffer[totalRead..]);
            if (bytesRead <= 0)
            {
                return false;
            }

            totalRead += bytesRead;
        }

        return true;
    }

    private static void WriteFrame(Stream output, string json)
    {
        var body = System.Text.Encoding.UTF8.GetBytes(json);
        Span<byte> lengthBuffer = stackalloc byte[4];
        BinaryPrimitives.WriteInt32LittleEndian(lengthBuffer, body.Length);

        output.Write(lengthBuffer);
        output.Write(body);
        output.Flush();
    }
}

