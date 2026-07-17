using System.Text.Json;
using System.Text.Json.Serialization;

namespace WaTranslator.Host.Protocol;

public static class NativeMessagingProtocol
{
    public const string ProtocolVersion = "1.0";

    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
}

public abstract record NativeMessageEnvelope([property: JsonPropertyName("type")] string Type);

public sealed record HandshakeMessage(
    [property: JsonPropertyName("extensionVersion")] string ExtensionVersion,
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("extensionId")] string ExtensionId) : NativeMessageEnvelope("handshake");

public sealed record HandshakeResultMessage(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("hostVersion")] string HostVersion,
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("extensionIdAllowlistStatus")] string ExtensionIdAllowlistStatus,
    [property: JsonPropertyName("integrityStatus")] string IntegrityStatus) : NativeMessageEnvelope("handshakeResult");

public sealed record LifecycleQueryMessage() : NativeMessageEnvelope("lifecycleQuery");

public sealed record LifecycleResultMessage(
    [property: JsonPropertyName("state")] string State,
    [property: JsonPropertyName("hostVersion")] string? HostVersion,
    [property: JsonPropertyName("protocolVersion")] string? ProtocolVersion,
    [property: JsonPropertyName("extensionIdAllowlistStatus")] string ExtensionIdAllowlistStatus,
    [property: JsonPropertyName("integrityStatus")] string IntegrityStatus,
    [property: JsonPropertyName("recoveryAction")] string? RecoveryAction) : NativeMessageEnvelope("lifecycleResult");

public sealed record TranslationRequestMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("translationRequest");

public sealed record TranslationResponseMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("translationResponse");

public sealed record ProviderHealthCheckRequestMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("providerHealthCheckRequest");

public sealed record ProviderHealthCheckResultMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("providerHealthCheckResult");

public sealed record ErrorMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message")] string Message) : NativeMessageEnvelope("error");
