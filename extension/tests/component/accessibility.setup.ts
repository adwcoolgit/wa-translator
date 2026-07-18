import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

export type AccessibilityHarnessState = {
  reducedMotion: boolean;
  prefersDarkTheme: boolean;
};

declare global {
  interface Window {
    __WA_TRANSLATOR_A11Y__?: AccessibilityHarnessState;
  }
}

const buildMatchMedia = (state: AccessibilityHarnessState) =>
  (query: string): MediaQueryList => {
    const matches = query.includes("prefers-reduced-motion")
      ? state.reducedMotion
      : query.includes("prefers-color-scheme: dark")
        ? state.prefersDarkTheme
        : false;

    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    };
  };

export const createAccessibilityHarnessState = (
  overrides: Partial<AccessibilityHarnessState> = {}
): AccessibilityHarnessState => ({
  reducedMotion: overrides.reducedMotion ?? true,
  prefersDarkTheme: overrides.prefersDarkTheme ?? false
});

export const installAccessibilityHarness = (
  overrides: Partial<AccessibilityHarnessState> = {}
): AccessibilityHarnessState => {
  const state = createAccessibilityHarnessState(overrides);
  if (typeof window !== "undefined") {
    window.__WA_TRANSLATOR_A11Y__ = state;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: buildMatchMedia(state)
    });
  }

  return state;
};

export const resetAccessibilityHarness = (): void => {
  if (typeof window !== "undefined") {
    delete window.__WA_TRANSLATOR_A11Y__;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: buildMatchMedia(createAccessibilityHarnessState())
    });
  }
};

afterEach(() => {
  cleanup();
  resetAccessibilityHarness();
});
