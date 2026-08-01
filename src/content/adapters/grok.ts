import type { PlatformAdapter } from "./types";
import { setNativeValue, setContentEditableValue } from "./types";

/**
 * Grok is available both at grok.com and embedded inside x.com/i/grok.
 * Its composer has shipped as both a <textarea> and a contenteditable div
 * depending on surface/version, so this adapter handles both.
 */
export const grokAdapter: PlatformAdapter = {
  id: "grok",
  name: "Grok",

  matches(hostname) {
    return hostname === "grok.com" || hostname === "x.com";
  },

  findComposer() {
    return (
      document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Grok" i]') ??
      document.querySelector<HTMLTextAreaElement>("main textarea") ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][data-testid*="grok" i]')
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
