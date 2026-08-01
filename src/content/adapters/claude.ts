import type { PlatformAdapter } from "./types";
import { setContentEditableValue } from "./types";

/**
 * Claude.ai uses a ProseMirror contenteditable composer, similar in
 * structure to ChatGPT's.
 */
export const claudeAdapter: PlatformAdapter = {
  id: "claude",
  name: "Claude",

  matches(hostname) {
    return hostname === "claude.ai";
  },

  findComposer() {
    return (
      document.querySelector<HTMLElement>('div[contenteditable="true"].ProseMirror') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][aria-label*="prompt" i]')
    );
  },

  getValue(composer) {
    return composer.innerText.trim();
  },

  setValue(composer, text) {
    setContentEditableValue(composer, text);
  },

  getAnchor(composer) {
    return composer.closest("form") ?? composer.parentElement ?? composer;
  },
};
