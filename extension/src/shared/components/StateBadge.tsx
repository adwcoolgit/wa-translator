import React from "react";

export interface StateBadgeProps {
  label: string;
  tone?: "neutral" | "info" | "ready" | "warning" | "error";
  size?: "compact" | "default";
  supportingText?: string | null;
}

export function StateBadge({
  label,
  tone = "neutral",
  size = "default",
  supportingText = null
}: StateBadgeProps) {
  const accessibleLabel = supportingText ? `${label}. ${supportingText}` : label;

  return (
    <span
      aria-label={accessibleLabel}
      className={`wa-translator-state-badge tone-${tone} size-${size}`}
      data-tone={tone}
    >
      <span>{label}</span>
      {supportingText ? <small>{supportingText}</small> : null}
    </span>
  );
}
