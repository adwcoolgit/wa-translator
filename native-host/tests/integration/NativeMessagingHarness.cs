using System.Buffers.Binary;
using System.Text;
using System.Text.Json;

namespace WaTranslator.NativeHost.IntegrationTests;

internal static class NativeMessagingHarness
{
    public static byte[] FrameJson<TPayload>(TPayload payload)
    {
        var json = JsonSerializer.Serialize(payload);
        var body = Encoding.UTF8.GetBytes(json);
        var frame = new byte[4 + body.Length];

        BinaryPrimitives.WriteInt32LittleEndian(frame.AsSpan(0, 4), body.Length);
        body.CopyTo(frame, 4);
        return frame;
    }

    public static string ReadFrame(byte[] frame)
    {
        if (frame.Length < 4)
        {
            throw new InvalidOperationException("Native Messaging frame must contain a 4-byte length header.");
        }

        var length = BinaryPrimitives.ReadInt32LittleEndian(frame.AsSpan(0, 4));
        if (length < 0 || frame.Length < 4 + length)
        {
            throw new InvalidOperationException("Native Messaging frame length is invalid.");
        }

        return Encoding.UTF8.GetString(frame, 4, length);
    }
}
