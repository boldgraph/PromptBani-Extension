/**
 * Client for Chrome's built-in on-device AI (the "Prompt API", backed by
 * Gemini Nano). This is Tier 2 of PromptBani's optimization pipeline: no
 * API key, no network request, no cost — but availability depends on the
 * user's Chrome version, OS, and hardware, and the model may need a
 * one-time download.
 *
 * IMPORTANT CAVEATS (please read before relying on this):
 * - This API is experimental and still evolving; the global may not exist
 *   at all in a given Chrome version/channel, or may require flags like
 *   chrome://flags/#optimization-guide-on-device-model and
 *   chrome://flags/#prompt-api-for-gemini-nano to be enabled.
 * - The model may need ~1.5–4GB downloaded via chrome://on-device-internals
 *   before it can run; if it's only "downloadable" (not yet downloaded),
 *   triggering the download typically requires a user gesture, which a
 *   background service worker does not reliably have. We treat this case
 *   as "not currently available" rather than trying to force a download.
 * - Gemini Nano is a small, fast model — noticeably weaker than hosted
 *   models like Claude or GPT-4 for nuanced prompt engineering. It's a
 *   reasonable free default, not a guaranteed match for OpenRouter quality.
 *
 * Every function here fails soft: any missing API, unsupported device, or
 * runtime error simply resolves to "unavailable" / throws a typed error
 * that the background worker catches to fall through to the next tier.
 */

// The LanguageModel global isn't yet in TypeScript's built-in DOM lib types.
declare const LanguageModel:
  | {
      availability(options?: Record<string, unknown>): Promise<
        "available" | "downloadable" | "downloading" | "unavailable"
      >;
      create(options?: {
        initialPrompts?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
      }): Promise<{
        prompt(input: string): Promise<string>;
        destroy(): void;
      }>;
    }
  | undefined;

export class ChromeAIUnavailableError extends Error {
  constructor(message = "Chrome's on-device AI model isn't available right now.") {
    super(message);
    this.name = "ChromeAIUnavailableError";
  }
}

/** Cheaply checks whether the Prompt API exists in this context at all. */
function hasPromptApi(): boolean {
  return typeof LanguageModel !== "undefined";
}

/**
 * Returns true only if the on-device model is ready to use *right now*
 * without needing a fresh download (which would require a user gesture we
 * can't guarantee from a background service worker).
 */
export async function isChromeAIReady(): Promise<boolean> {
  if (!hasPromptApi()) return false;
  try {
    const availability = await LanguageModel!.availability();
    return availability === "available";
  } catch {
    return false;
  }
}

export async function callChromeAI(systemPrompt: string, userMessage: string): Promise<string> {
  if (!hasPromptApi()) {
    throw new ChromeAIUnavailableError("This browser doesn't support the on-device Prompt API.");
  }

  let session: Awaited<ReturnType<NonNullable<typeof LanguageModel>["create"]>> | null = null;
  try {
    const model = LanguageModel;
    if (!model) {
      throw new ChromeAIUnavailableError("This browser doesn't support the on-device Prompt API.");
    }
    session = await model.create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
    });
    const result = await session.prompt(userMessage);
    if (!result?.trim()) {
      throw new ChromeAIUnavailableError("The on-device model returned an empty response.");
    }
    return result.trim();
  } catch (err) {
    if (err instanceof ChromeAIUnavailableError) throw err;
    throw new ChromeAIUnavailableError(
      `On-device model failed: ${err instanceof Error ? err.message : "unknown error"}`
    );
  } finally {
    session?.destroy();
  }
}
