import React from "react";

export interface TargetChangedWarningProps {
  targetType: "editableSelection" | "fullComposer" | "caretInsert" | "nonEditableSelection";
  reason: string;
}

const buildFallbackCopy = (targetType: TargetChangedWarningProps["targetType"]): string => {
  if (targetType === "nonEditableSelection") {
    return "Safer fallback: copy the current result or translate the latest message selection again.";
  }

  return "Safer fallback: copy the current result or translate the latest composer target again.";
};

export function TargetChangedWarning({ targetType, reason }: TargetChangedWarningProps) {
  return (
    <div aria-live="polite" data-testid="target-changed-warning" role="alert">
      <strong>Target changed</strong>
      <p>{reason}</p>
      <p>{buildFallbackCopy(targetType)}</p>
    </div>
  );
}
