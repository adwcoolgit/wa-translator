export type AccessibilityHarnessState = {
  reducedMotion: boolean;
  prefersDarkTheme: boolean;
};

declare global {
  interface Window {
    __WA_TRANSLATOR_A11Y__?: AccessibilityHarnessState;
  }
}

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
  }

  return state;
};
