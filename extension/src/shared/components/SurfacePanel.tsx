import React from "react";
import type { ReactNode } from "react";

import { StateBadge, type StateBadgeProps } from "./StateBadge";

export interface SurfacePanelAction {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  emphasis?: "primary" | "secondary" | "tertiary";
  disabled?: boolean;
  ariaLabel?: string;
}

export interface SurfacePanelProps {
  title: string;
  children?: ReactNode;
  badges?: StateBadgeProps[];
  eyebrow?: string;
  description?: string;
  actions?: SurfacePanelAction[];
  footer?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  tone?: "compact" | "elevated" | "inline";
  dataSurface?: string;
  statusLabel?: string;
  testId?: string;
}

export function SurfacePanel({
  title,
  children,
  badges = [],
  eyebrow,
  description,
  actions = [],
  footer,
  headingLevel = 2,
  tone = "elevated",
  dataSurface,
  statusLabel,
  testId
}: SurfacePanelProps) {
  const HeadingTag = `h${headingLevel}` as keyof React.JSX.IntrinsicElements;

  return (
    <section
      className={`wa-translator-surface-panel tone-${tone}`}
      data-surface={dataSurface}
      data-testid={testId}
    >
      <header className="wa-translator-surface-panel-header">
        {eyebrow ? <p className="wa-translator-surface-panel-eyebrow">{eyebrow}</p> : null}
        {React.createElement(HeadingTag, { className: "wa-translator-surface-panel-title" }, title)}
        {description ? <p className="wa-translator-surface-panel-description">{description}</p> : null}
        {statusLabel ? <p className="wa-translator-surface-panel-status">{statusLabel}</p> : null}
        {badges.length > 0 ? (
          <div className="wa-translator-surface-panel-badges">
            {badges.map((badge) => (
              <StateBadge
                key={`${badge.label}-${badge.tone ?? "neutral"}`}
                label={badge.label}
                size={badge.size}
                supportingText={badge.supportingText}
                tone={badge.tone}
              />
            ))}
          </div>
        ) : null}
      </header>

      <div className="wa-translator-surface-panel-body">{children}</div>

      {actions.length > 0 ? (
        <div className="wa-translator-surface-panel-actions">
          {actions.map((action) => (
            <button
              aria-label={action.ariaLabel}
              className={`wa-translator-surface-panel-action emphasis-${action.emphasis ?? "secondary"}`}
              disabled={action.disabled}
              key={`${action.label}-${action.emphasis ?? "secondary"}`}
              onClick={action.onClick}
              type={action.type ?? "button"}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {footer ? <footer className="wa-translator-surface-panel-footer">{footer}</footer> : null}
    </section>
  );
}
