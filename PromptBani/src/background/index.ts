import { callOpenRouter, OpenRouterError } from "../api/openrouter";
import { callChromeAI, ChromeAIUnavailableError } from "../api/chromeAI";
import { buildSystemPrompt, buildUserMessage } from "../prompts/promptbani-system";
import { MESSAGE_TYPES, type PromptLanguage, type PromptMode } from "../utils/constants";
import { templateOptimize } from "../utils/templateOptimize";
import { getSettings } from "../utils/storage";

/**
 * Background service worker (MV3).
 *
 * PromptBani optimizes every prompt through a 3-tier fallback chain, so
 * the extension works out of the box with **no required API key**:
 *
 *   Tier 1 — OpenRouter (opt-in): used only if the user has entered their
 *            own API key in Settings. Best quality, any model they pick.
 *   Tier 2 — Chrome's built-in on-device model (Gemini Nano): free, no
 *            network call, but depends on browser/device support and a
 *            one-time model download. See src/api/chromeAI.ts for caveats.
 *   Tier 3 — Local template rewrite: pure JavaScript, no AI, always
 *            succeeds. Guarantees the feature never simply fails.
 *
 * Tiers 1 and 2 both call a real language model and are sent the
 * PromptBani system prompt completely verbatim (see
 * src/prompts/promptbani-system.ts) — mode and language selections from
 * the UI are communicated only via the user-turn message, never by
 * altering the system prompt. Tier 3 doesn't call any model at all, so
 * the system prompt doesn't apply to it.
 *
 * All network/model calls happen here (not in the content script) so an
 * OpenRouter API key is never exposed to page-context JavaScript on
 * ChatGPT/Gemini/etc., and so a page's own Content-Security-Policy can't
 * block the request.
 */

interface OptimizeRequestMessage {
  type: typeof MESSAGE_TYPES.OPTIMIZE_PROMPT;
  payload: {
    rawPrompt: string;
    mode: PromptMode;
    language: PromptLanguage;
  };
}

function isOptimizeRequest(msg: unknown): msg is OptimizeRequestMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as { type?: unknown }).type === MESSAGE_TYPES.OPTIMIZE_PROMPT
  );
}

type Engine = "openrouter" | "chrome-ai" | "template";

async function optimizeWithFallback(
  rawPrompt: string,
  mode: PromptMode,
  language: PromptLanguage
): Promise<{ optimizedPrompt: string; engine: Engine }> {
  const settings = await getSettings();
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(rawPrompt, mode, language);

  // Tier 1: OpenRouter, only if the user opted in with their own key.
  if (settings.apiKey) {
    try {
      const optimizedPrompt = await callOpenRouter({
        apiKey: settings.apiKey,
        model: settings.model,
        systemPrompt,
        userMessage,
      });
      return { optimizedPrompt, engine: "openrouter" };
    } catch (err) {
      // A configured key that fails is likely worth surfacing rather than
      // silently downgrading quality, but we still fall through so the
      // user's click always produces *something* usable.
      console.warn("PromptBani: OpenRouter failed, falling back.", err);
    }
  }

  // Tier 2: Chrome's on-device model, if this browser/device supports it.
  try {
    const optimizedPrompt = await callChromeAI(systemPrompt, userMessage);
    return { optimizedPrompt, engine: "chrome-ai" };
  } catch (err) {
    if (!(err instanceof ChromeAIUnavailableError)) {
      console.warn("PromptBani: on-device AI failed unexpectedly, falling back.", err);
    }
  }

  // Tier 3: local template rewrite. No network, no AI, cannot fail.
  return { optimizedPrompt: templateOptimize(rawPrompt, mode, language), engine: "template" };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isOptimizeRequest(message)) return undefined;

  (async () => {
    try {
      const { optimizedPrompt, engine } = await optimizeWithFallback(
        message.payload.rawPrompt,
        message.payload.mode,
        message.payload.language
      );
      sendResponse({ type: MESSAGE_TYPES.OPTIMIZE_RESULT, optimizedPrompt, engine });
    } catch (err) {
      const errorMessage =
        err instanceof OpenRouterError ? err.message : "Unexpected error optimizing prompt.";
      sendResponse({ type: MESSAGE_TYPES.OPTIMIZE_ERROR, error: errorMessage });
    }
  })();

  // Signals to Chrome that sendResponse will be called asynchronously.
  return true;
});
