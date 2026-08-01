import type { PlatformAdapter } from "./types";
import { setContentEditableValue } from "./types";

/**
 * Google Gemini (gemini.google.com) uses a contenteditable rich text
 * editor inside a custom <rich-textarea> web component.
 */
export const geminiAdapter: PlatformAdapter = {
  id: "gemini",
  name: "Google Gemini",

  matches(hostname) {
    return hostname === "gemini.google.com";
  },

  findComposer() {
    return (
      document.querySelector<HTMLElement>(".ql-editor[contenteditable='true']") ??
      document.querySelector<HTMLElement>("rich-textarea div[contenteditable='true']")
    );
  },

  getValue(composer) {
    return composer.innerText.trim();
  },

  setValue(composer, text) {
    setContentEditableValue(composer, text);
  },

  getAnchor(composer) {
    return (
      composer.closest("div[class*='input-area']") ??
      composer.parentElement ??
      composer
    );
  },
};
