/**
 * The PromptBani system prompt (sent verbatim — see
 * src/prompts/promptbani-system-source.txt) mandates a response made of
 * two Markdown code blocks (main prompt, then negative prompt) followed
 * by a "PromptBani Signature" footer meant for a human reading a chat
 * transcript.
 *
 * This extension's job is to take that response and put the *optimized
 * prompt* into another site's chat input box. Pasting the raw response
 * verbatim — code fences, negative-prompt block, and an Instagram
 * signature included — into someone's ChatGPT input would be unusable.
 * This parser extracts just the pieces the composer needs; nothing here
 * changes what was sent to or returned by the model, only how PromptBani
 * *displays/inserts* that already-complete response.
 */

export interface ParsedPromptBaniResponse {
  /** Content of the first code block (the main optimized prompt). */
  mainPrompt: string;
  /** Content of the second code block (the negative prompt), if present. */
  negativePrompt: string | null;
  /** Anything after the last code block (the PromptBani signature/footer). */
  footer: string | null;
  /** The full, unmodified text returned by the model. */
  raw: string;
}

export function parsePromptBaniResponse(raw: string): ParsedPromptBaniResponse {
  const codeBlockPattern = /```(?:[\w-]*)\n?([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = codeBlockPattern.exec(raw)) !== null) {
    blocks.push(match[1].trim());
  }

  if (blocks.length === 0) {
    // Model didn't follow the mandated format (e.g. it asked a clarifying
    // question instead, per the system prompt's "Exception for
    // Ambiguity" — or a smaller/offline engine that doesn't reliably
    // produce fenced blocks). Fall back to the full raw text.
    return { mainPrompt: raw.trim(), negativePrompt: null, footer: null, raw };
  }

  const mainPrompt = blocks[0];
  const negativePrompt = blocks.length > 1 ? blocks[1] : null;

  const lastFenceIndex = raw.lastIndexOf("```");
  const footerText = lastFenceIndex >= 0 ? raw.slice(lastFenceIndex + 3).trim() : "";
  const footer = footerText.length > 0 ? footerText : null;

  return { mainPrompt, negativePrompt, footer, raw };
}

/** Builds the text to actually insert into / copy from a chat composer. */
export function composerTextFrom(parsed: ParsedPromptBaniResponse): string {
  if (!parsed.negativePrompt) return parsed.mainPrompt;
  return `${parsed.mainPrompt}\n\nNegative Prompt: ${parsed.negativePrompt}`;
}
