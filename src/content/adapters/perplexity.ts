import type { PlatformAdapter } from "./types";
import { setNativeValue, setContentEditableValue } from "./types";

/**
 * Perplexity's home/search composer is a <textarea>, but on some
 * follow-up/thread views it can render as a contenteditable div — this
 * adapter checks for both.
 */
export const perplexityAdapter: PlatformAdapter = {
  id: "perplexity",
  name: "Perplexity",

  matches(hostname) {
    return hostname === "www.perplexity.ai" || hostname === "perplexity.ai";
  },

  findComposer() {
    return (
      document.querySelector<HTMLTextAreaElement>("textarea[placeholder*='Ask' i]") ??
      document.querySelector<HTMLTextAreaElement>("main textarea") ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][role="textbox"]')
    );
  },

  getValue(composer) {
    if (composer instanceof HTMLTextAreaElement) return composer.value.trim();
    return composer.innerText.trim();
  },

  setValue(composer, text) {
    if (composer instanceof HTMLTextAreaElement) {
      setNativeValue(composer, text);
    } else {
      setContentEditableValue(composer, text);
    }
  },

  getAnchor(composer) {
    return composer.closest("form") ?? composer.parentElement ?? composer;
  },
};
