import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <main data-surface="onboarding">WA Translator onboarding surface scaffold</main>;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
