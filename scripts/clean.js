// Cross-platform replacement for `rm -rf dist`. Shell built-ins like `rm`
// don't exist in Windows cmd.exe/PowerShell, so we do this in Node instead,
// which works identically on Windows, macOS, and Linux.
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptsDir, "..");
const distDir = path.join(projectRoot, "dist");

await rm(distDir, { recursive: true, force: true });
console.log("PromptBani: cleaned dist/");
