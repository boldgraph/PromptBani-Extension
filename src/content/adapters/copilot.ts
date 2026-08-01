import type { PlatformAdapter } from "./types";
import { setNativeValue, setContentEditableValue } from "./types";

/**
 * Microsoft Copilot (copilot.microsoft.com) uses a contenteditable
 * composer inside its chat surface; a <textarea> fallback is kept for
 * older/simplified layouts.
 */
export const copilotAdapter: PlatformAdapter = {
  id: "copilot",
  name: "Microsoft Copilot",

  matches(hostname) {
    return hostname === "copilot.microsoft.com";
  },

  findComposer() {
    return (
      document.querySelector<HTMLElement>('#userInput') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][role="textbox"]') ??
      document.querySelector<HTMLTextAreaElement>("textarea")
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
