import type { PlatformAdapter } from "./types";
import { setContentEditableValue } from "./types";

/**
 * ChatGPT (chatgpt.com / chat.openai.com) uses a ProseMirror-based
 * contenteditable <div id="prompt-textarea"> for its composer.
 */
export const chatGptAdapter: PlatformAdapter = {
  id: "chatgpt",
  name: "ChatGPT",

  matches(hostname) {
    return hostname === "chatgpt.com" || hostname === "chat.openai.com";
  },

  findComposer() {
    return (
      document.querySelector<HTMLElement>("#prompt-textarea") ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][data-id]')
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
      composer.closest("form")?.querySelector<HTMLElement>('[data-testid="composer-trailing-actions"]') ??
      composer.parentElement ??
      composer
    );
  },
};
