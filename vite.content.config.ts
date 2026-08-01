import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Builds the content script as a single classic (non-module) IIFE file.
// Chrome MV3 content scripts are injected as classic scripts, so no ESM
// imports are allowed in the final bundle — everything must be inlined.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false, // preserve popup output from the previous build step
    rollupOptions: {
      input: resolve(__dirname, "src/content/index.ts"),
      output: {
        entryFileNames: "content/content.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
