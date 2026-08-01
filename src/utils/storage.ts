import { DEFAULT_MODEL, STORAGE_KEYS, type PromptLanguage, type PromptMode } from "./constants";

/**
 * Thin, typed wrapper around chrome.storage.sync so the rest of the
 * codebase never touches the raw chrome.storage API directly.
 *
 * chrome.storage.sync is used (not local) so a user's model choice and
 * default mode follow them across signed-in Chrome profiles. The API key
 * is stored the same way for simplicity — PromptBani has no backend, so
 * the key never leaves the user's browser except in direct calls to
 * OpenRouter's API over HTTPS.
 */

export interface PromptBaniSettings {
  apiKey: string;
  model: string;
  defaultMode: PromptMode;
  language: PromptLanguage;
  replaceOriginal: boolean;
  theme: "light" | "dark" | "system";
}

export const DEFAULT_SETTINGS: PromptBaniSettings = {
  apiKey: "",
  model: DEFAULT_MODEL,
  defaultMode: "auto",
  language: "auto",
  replaceOriginal: true,
  theme: "system",
};

export async function getSettings(): Promise<PromptBaniSettings> {
  const stored = await chrome.storage.sync.get([
    STORAGE_KEYS.apiKey,
    STORAGE_KEYS.model,
    STORAGE_KEYS.defaultMode,
    STORAGE_KEYS.language,
    STORAGE_KEYS.replaceOriginal,
    STORAGE_KEYS.theme,
  ]);

  return {
    apiKey: stored[STORAGE_KEYS.apiKey] ?? DEFAULT_SETTINGS.apiKey,
    model: stored[STORAGE_KEYS.model] ?? DEFAULT_SETTINGS.model,
    defaultMode: stored[STORAGE_KEYS.defaultMode] ?? DEFAULT_SETTINGS.defaultMode,
    language: stored[STORAGE_KEYS.language] ?? DEFAULT_SETTINGS.language,
    replaceOriginal:
      stored[STORAGE_KEYS.replaceOriginal] ?? DEFAULT_SETTINGS.replaceOriginal,
    theme: stored[STORAGE_KEYS.theme] ?? DEFAULT_SETTINGS.theme,
  };
}

export async function saveSettings(
  partial: Partial<PromptBaniSettings>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (partial.apiKey !== undefined) payload[STORAGE_KEYS.apiKey] = partial.apiKey;
  if (partial.model !== undefined) payload[STORAGE_KEYS.model] = partial.model;
  if (partial.defaultMode !== undefined)
    payload[STORAGE_KEYS.defaultMode] = partial.defaultMode;
  if (partial.language !== undefined) payload[STORAGE_KEYS.language] = partial.language;
  if (partial.replaceOriginal !== undefined)
    payload[STORAGE_KEYS.replaceOriginal] = partial.replaceOriginal;
  if (partial.theme !== undefined) payload[STORAGE_KEYS.theme] = partial.theme;

  await chrome.storage.sync.set(payload);
}

export function onSettingsChanged(
  callback: (changes: Partial<PromptBaniSettings>) => void
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "sync") return;
    const result: Partial<PromptBaniSettings> = {};
    if (changes[STORAGE_KEYS.apiKey]) result.apiKey = changes[STORAGE_KEYS.apiKey].newValue;
    if (changes[STORAGE_KEYS.model]) result.model = changes[STORAGE_KEYS.model].newValue;
    if (changes[STORAGE_KEYS.defaultMode])
      result.defaultMode = changes[STORAGE_KEYS.defaultMode].newValue;
    if (changes[STORAGE_KEYS.language]) result.language = changes[STORAGE_KEYS.language].newValue;
    if (changes[STORAGE_KEYS.replaceOriginal])
      result.replaceOriginal = changes[STORAGE_KEYS.replaceOriginal].newValue;
    if (changes[STORAGE_KEYS.theme]) result.theme = changes[STORAGE_KEYS.theme].newValue;
    callback(result);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
