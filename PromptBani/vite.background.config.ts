import { defineConfig } from "vite";
import { resolve } from "path";

// Builds the background service worker as a single IIFE file.
// MV3 service workers *can* be ES modules, but bundling as a self-contained
// IIFE avoids any import-resolution quirks across browsers.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, "src/background/index.ts"),
      output: {
        entryFileNames: "background/background.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
