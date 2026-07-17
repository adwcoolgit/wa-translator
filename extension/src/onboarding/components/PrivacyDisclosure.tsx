import type { ChangeEvent } from "react";

export interface PrivacyDisclosureProps {
  consentAccepted: boolean;
  onConsentChange: (accepted: boolean) => void;
}

export function PrivacyDisclosure({
  consentAccepted,
  onConsentChange
}: PrivacyDisclosureProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onConsentChange(event.currentTarget.checked);
  };

  return (
    <section aria-labelledby="privacy-disclosure-title" className="onboarding-card">
      <h2 id="privacy-disclosure-title">Privacy and trust disclosure</h2>
      <p>
        WA Translator adalah produk independen, bukan aplikasi resmi WhatsApp atau Meta.
        Ekstensi ini hanya bekerja di WhatsApp Web pada Chrome desktop dan membutuhkan local
        companion di Windows untuk memproses provider CLI.
      </p>
      <ul>
        <li>No auto-send. WA Translator tidak pernah menekan tombol kirim untuk Anda.</li>
        <li>Original text tetap terlihat. Terjemahan selalu additive, bukan mengganti bubble histori.</li>
        <li>Source text dan translation text tidak disimpan di persistent storage pada MVP.</li>
        <li>Health check onboarding hanya memakai synthetic text, bukan isi chat WhatsApp Anda.</li>
      </ul>
      <label>
        <input
          checked={consentAccepted}
          name="privacy-consent"
          onChange={handleChange}
          type="checkbox"
        />{" "}
        Saya memahami disclosure privasi, batas no auto-send, dan kebutuhan local companion.
      </label>
    </section>
  );
}
