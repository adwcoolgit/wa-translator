// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrivacyDisclosure } from "../../../src/onboarding/components/PrivacyDisclosure";

describe("PrivacyDisclosure", () => {
  it("renders independent-product, no-auto-send, and synthetic health check disclosures", () => {
    render(<PrivacyDisclosure consentAccepted={false} onConsentChange={vi.fn()} />);

    expect(screen.getByText(/produk independen/i)).toBeInTheDocument();
    expect(screen.getByText(/WA Translator tidak pernah menekan tombol kirim/i)).toBeInTheDocument();
    expect(screen.getByText(/synthetic text/i)).toBeInTheDocument();
  });

  it("emits consent changes when the checkbox is toggled", () => {
    const onConsentChange = vi.fn();
    render(<PrivacyDisclosure consentAccepted={false} onConsentChange={onConsentChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: /saya memahami/i }));

    expect(onConsentChange).toHaveBeenCalledWith(true);
  });
});
