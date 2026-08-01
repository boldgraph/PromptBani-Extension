import type { PlatformAdapter } from "./types";
import { setNativeValue } from "./types";

/** DeepSeek chat (chat.deepseek.com) uses a plain <textarea> composer. */
export const deepseekAdapter: PlatformAdapter = {
  id: "deepseek",
  name: "DeepSeek",

  matches(hostname) {
    return hostname === "chat.deepseek.com";
  },

  findComposer() {
    return document.querySelector<HTMLTextAreaElement>("#chat-input, textarea");
  },

  getValue(composer) {
    return (composer as HTMLTextAreaElement).value.trim();
  },

  setValue(composer, text) {
    setNativeValue(composer as HTMLTextAreaElement, text);
  },

  getAnchor(composer) {
    return composer.closest("form") ?? composer.parentElement ?? composer;
  },
};
