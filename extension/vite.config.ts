import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      react: resolve(__dirname, "node_modules/react"),
      "react-dom": resolve(__dirname, "node_modules/react-dom"),
      "@testing-library/react": resolve(__dirname, "node_modules/@testing-library/react"),
      "@testing-library/jest-dom": resolve(__dirname, "node_modules/@testing-library/jest-dom")
    }
  },
  plugins: [react()],
  publicDir: "public",
  server: {
    fs: {
      allow: [resolve(__dirname, "..")]
    }
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: [resolve(__dirname, "tests/component/accessibility.setup.ts")],
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "../tests/accessibility/**/*.test.ts",
      "../tests/accessibility/**/*.test.tsx",
      "../tests/contract/**/*.test.ts",
      "../tests/fixtures/**/*.test.ts",
      "../tests/performance/**/*.benchmark.ts",
      "../tests/security/**/*.test.ts"
    ]
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
        onboarding: resolve(__dirname, "src/onboarding/index.html"),
        preview: resolve(__dirname, "src/preview/index.html")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});

