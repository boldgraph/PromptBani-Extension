// Zips the built dist/ folder into promptbani.zip for easy sharing /
// "Load unpacked" style distribution or Chrome Web Store upload.
import { createWriteStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, "..");
const distDir = path.join(projectRoot, "dist");
const outFile = path.join(projectRoot, "promptbani.zip");

if (!existsSync(distDir)) {
  console.error('dist/ not found — run "npm run build" first.');
  process.exit(1);
}

execFile("zip", ["-r", outFile, "."], { cwd: distDir }, (err) => {
  if (err) {
    console.error("Zip failed. Is `zip` installed on your system?", err);
    process.exit(1);
  }
  console.log(`Created ${outFile}`);
});
