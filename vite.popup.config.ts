import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Builds the extension's popup UI (React) as a normal Vite HTML app.
// `root` is set to src/popup so the built index.html lands at
// dist/popup/index.html (matching manifest.json's default_popup path)
// instead of mirroring the full src/ directory structure.
export default defineConfig({
  root: resolve(__dirname, "src/popup"),
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist/popup"),
    emptyOutDir: true, // popup build runs first and clears dist/popup/
    rollupOptions: {
      input: resolve(__dirname, "src/popup/index.html"),
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
