import React from "react";

export interface TargetChangedWarningProps {
  targetType: "editableSelection" | "fullComposer" | "caretInsert" | "nonEditableSelection";
}

const buildWarningCopy = (targetType: TargetChangedWarningProps["targetType"]): string => {
  if (targetType === "nonEditableSelection") {
    return "Selection source berubah atau hilang. Tinjau hasil terlebih dahulu sebelum melanjutkan.";
  }

  return "Composer berubah sejak permintaan dimulai. Apply diblokir sampai Anda menjalankan translasi ulang pada target terbaru.";
};

export function TargetChangedWarning({ targetType }: TargetChangedWarningProps) {
  return (
    <div aria-live="polite" data-testid="target-changed-warning" role="alert">
      <strong>Target changed</strong>
      <p>{buildWarningCopy(targetType)}</p>
    </div>
  );
}
