import type { PromptMode } from "./constants";

/**
 * Lightweight, local keyword heuristic used only to give the model a
 * *hint* when the user leaves the mode on "Auto Detect". The model
 * (guided by the PromptBani system prompt) always makes the final call —
 * this function never overrides an explicit user selection, and its
 * output is advisory, not authoritative.
 */
export function guessMode(rawPrompt: string): Exclude<PromptMode, "auto"> {
  const text = rawPrompt.toLowerCase();

  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (
    has(
      "generate an image",
      "draw ",
      "illustration",
      "photo of",
      "picture of",
      "logo of",
      "wallpaper",
      "midjourney",
      "stable diffusion",
      "dall-e",
      "dalle"
    )
  ) {
    return "image";
  }

  if (has("video of", "animate", "animation", "sora", "runway", "clip of", "b-roll")) {
    return "video";
  }

  if (
    has(
      "function",
      "class ",
      "bug",
      "refactor",
      "regex",
      "algorithm",
      "compile",
      "typescript",
      "javascript",
      "python",
      "sql query",
      "api endpoint",
      "stack trace",
      "unit test"
    )
  ) {
    return "coding";
  }

  if (has("json", "schema", "api response", "structured data")) {
    return "json";
  }

  if (has("<prompt", "<subject>", "html tag", "xml tag")) {
    return "html-tags";
  }

  if (
    has(
      "essay",
      "article",
      "blog post",
      "email",
      "email to",
      "story about",
      "poem",
      "write a ",
      "summary of",
      "letter to"
    )
  ) {
    return "writing";
  }

  return "freestyle";
}
