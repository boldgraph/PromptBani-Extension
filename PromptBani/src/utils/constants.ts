/**
 * Shared constants used across the extension (content script, popup,
 * background worker). Keeping these in one place avoids magic strings.
 */

export type PromptMode =
  | "auto"
  | "image"
  | "video"
  | "coding"
  | "writing"
  | "json"
  | "html-tags"
  | "freestyle";

export const PROMPT_MODES: { value: PromptMode; label: string }[] = [
  { value: "auto", label: "Auto Detect" },
  { value: "image", label: "Image Generation" },
  { value: "video", label: "Video Generation" },
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "json", label: "JSON" },
  { value: "html-tags", label: "HTML Tags" },
  { value: "freestyle", label: "Freestyle" },
];

/** Default model used against the OpenRouter API. Changeable in Settings. */
export const DEFAULT_MODEL = "anthropic/claude-3.5-haiku";

export type PromptLanguage =
  | "auto"
  | "en"
  | "fa"
  | "ar"
  | "es"
  | "fr"
  | "de"
  | "tr"
  | "zh"
  | "ja"
  | "pt"
  | "ru";

export const PROMPT_LANGUAGES: { value: PromptLanguage; label: string }[] = [
  { value: "auto", label: "Default (English)" },
  { value: "en", label: "English" },
  { value: "fa", label: "فارسی" },
  { value: "ar", label: "العربية" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "tr", label: "Türkçe" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
];

/** English display name for each language, used in the instruction sent to the model. */
export const LANGUAGE_NAMES: Record<Exclude<PromptLanguage, "auto">, string> = {
  en: "English",
  fa: "Persian (Farsi)",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  tr: "Turkish",
  zh: "Chinese",
  ja: "Japanese",
  pt: "Portuguese",
  ru: "Russian",
};

/** OpenRouter is OpenAI-compatible; this is the single endpoint we call. */
export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** chrome.storage.sync keys — kept in one place to avoid typos. */
export const STORAGE_KEYS = {
  apiKey: "promptbani_api_key",
  model: "promptbani_model",
  defaultMode: "promptbani_default_mode",
  language: "promptbani_language",
  replaceOriginal: "promptbani_replace_original",
  theme: "promptbani_theme",
} as const;

/** Runtime message channel names between content script and background. */
export const MESSAGE_TYPES = {
  OPTIMIZE_PROMPT: "PROMPTBANI_OPTIMIZE_PROMPT",
  OPTIMIZE_RESULT: "PROMPTBANI_OPTIMIZE_RESULT",
  OPTIMIZE_ERROR: "PROMPTBANI_OPTIMIZE_ERROR",
} as const;
