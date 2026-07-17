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
        targetChanged: false,
        canApply: true,
        canCopy: true,
        canCancel: true,
        canUndo: false,
        requestState: "success",
        error: null,
        applyLabel: "Replace selection",
        undoLabel: "Undo"
      }}
      handlers={{}}
    />
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
