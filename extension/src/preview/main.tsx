import React from "react";
import { createRoot } from "react-dom/client";
import { ManualPreviewApp } from "./ManualPreviewApp";

function App() {
  return (
    <ManualPreviewApp
      model={{
        open: true,
        sourceText: "Please translate this message into Indonesian.",
        translation: "Tolong terjemahkan pesan ini ke dalam Bahasa Indonesia.",
        targetType: "editableSelection",
        targetLabel: "Selected composer text",
        targetDescription: "Only the highlighted composer text is eligible for replacement.",
        requestSummary: "Target language: Bahasa Indonesia.",
        targetChanged: false,
        canApply: true,
        canCopy: true,
        canCancel: true,
        canUndo: false,
        canRetry: false,
        requestState: "success",
        statusText: "Translation ready for review.",
        error: null,
        applyLabel: "Replace selection",
        retryLabel: "Retry translation",
        copyLabel: "Copy translation",
        undoLabel: "Undo",
        staleReason: null,
        draftProtectionSummary: "Only the selected composer text can be replaced. The rest of your draft stays unchanged."
      }}
      handlers={{}}
    />
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
