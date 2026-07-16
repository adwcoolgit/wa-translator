using System.Text.Json;
using System.Text.Json.Serialization;

namespace WaTranslator.Host.Protocol;

internal static class NativeMessagingProtocol
{
    public const string ProtocolVersion = "1.0";

    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };
}

internal abstract record NativeMessageEnvelope([property: JsonPropertyName("type")] string Type);

internal sealed record HandshakeMessage(
    [property: JsonPropertyName("extensionVersion")] string ExtensionVersion,
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("extensionId")] string ExtensionId) : NativeMessageEnvelope("handshake");

internal sealed record HandshakeResultMessage(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("hostVersion")] string HostVersion,
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("extensionIdAllowlistStatus")] string ExtensionIdAllowlistStatus,
    [property: JsonPropertyName("integrityStatus")] string IntegrityStatus) : NativeMessageEnvelope("handshakeResult");

internal sealed record LifecycleQueryMessage() : NativeMessageEnvelope("lifecycleQuery");

internal sealed record LifecycleResultMessage(
    [property: JsonPropertyName("state")] string State,
    [property: JsonPropertyName("hostVersion")] string? HostVersion,
    [property: JsonPropertyName("protocolVersion")] string? ProtocolVersion,
    [property: JsonPropertyName("extensionIdAllowlistStatus")] string ExtensionIdAllowlistStatus,
    [property: JsonPropertyName("integrityStatus")] string IntegrityStatus,
    [property: JsonPropertyName("recoveryAction")] string? RecoveryAction) : NativeMessageEnvelope("lifecycleResult");

internal sealed record TranslationRequestMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("translationRequest");

internal sealed record TranslationResponseMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("payload")] JsonElement Payload) : NativeMessageEnvelope("translationResponse");

internal sealed record ErrorMessage(
    [property: JsonPropertyName("protocolVersion")] string ProtocolVersion,
    [property: JsonPropertyName("code")] string Code,
    [property: JsonPropertyName("message")] string Message) : NativeMessageEnvelope("error");
