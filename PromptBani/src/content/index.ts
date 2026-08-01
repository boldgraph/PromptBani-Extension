import { getActiveAdapter } from "./adapters";
import { mountPromptBaniWidget } from "./widget";

/**
 * Content script entry point.
 *
 * Most target sites (ChatGPT, Gemini, Claude, etc.) are single-page apps
 * that render their composer asynchronously and can re-render it on
 * navigation between chats. A MutationObserver on document.body — rather
 * than a one-off DOMContentLoaded check — keeps PromptBani's button
 * attached no matter how the host page mutates.
 */

const adapter = getActiveAdapter(window.location.hostname);

if (adapter) {
  const tryMount = () => {
    const composer = adapter.findComposer();
    if (composer) {
      mountPromptBaniWidget(adapter, composer);
    }
  };

  // Initial attempt (composer may already be present on fast-loading pages).
  tryMount();

  const observer = new MutationObserver(() => {
    tryMount();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
