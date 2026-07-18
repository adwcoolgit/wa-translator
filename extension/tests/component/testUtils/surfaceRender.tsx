import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

import {
  installAccessibilityHarness,
  type AccessibilityHarnessState
} from "../accessibility.setup";

export interface SurfaceRenderOptions extends Omit<RenderOptions, "container"> {
  accessibility?: Partial<AccessibilityHarnessState>;
  hostAttributes?: Record<string, string>;
}

export const renderSurface = (
  ui: ReactElement,
  options: SurfaceRenderOptions = {}
) => {
  const { accessibility, hostAttributes = {}, ...renderOptions } = options;
  const accessibilityState = installAccessibilityHarness(accessibility);
  const host = document.createElement("div");
  host.dataset.surfaceHost = "true";

  for (const [name, value] of Object.entries(hostAttributes)) {
    host.setAttribute(name, value);
  }

  document.body.append(host);

  const renderResult = render(ui, {
    container: host,
    ...renderOptions
  });

  return {
    ...renderResult,
    accessibilityState,
    host
  };
};
