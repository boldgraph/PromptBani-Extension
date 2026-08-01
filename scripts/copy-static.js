// Copies static assets (manifest.json, icons) into dist/ after the three
// Vite build steps (popup, content, background) have run. Kept as a tiny
// dependency-free Node script rather than pulling in a Vite plugin.
import { copyFile, mkdir, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, "..");
const distDir = path.join(projectRoot, "dist");

async function main() {
  await mkdir(distDir, { recursive: true });
  await copyFile(
    path.join(projectRoot, "manifest.json"),
    path.join(distDir, "manifest.json")
  );

  const iconsSrc = path.join(projectRoot, "public", "icons");
  const iconsDest = path.join(distDir, "icons");
  if (existsSync(iconsSrc)) {
    await mkdir(iconsDest, { recursive: true });
    await cp(iconsSrc, iconsDest, { recursive: true });
  }

  console.log("PromptBani: copied manifest.json and icons/ into dist/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
