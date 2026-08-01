import PROMPTBANI_SYSTEM_PROMPT from "./promptbani-system-source.txt?raw";
import type { PromptMode } from "../utils/constants";
import type { PromptLanguage } from "../utils/constants";
import { LANGUAGE_NAMES } from "../utils/constants";

/**
 * The PromptBani system prompt.
 *
 * IMPORTANT: this is sent to the model completely verbatim, exactly as
 * provided by the PromptBani author, with ZERO modification. It is stored
 * in `promptbani-system-source.txt` (a plain text file, not a .ts template
 * literal) specifically so nothing in this codebase can accidentally
 * reword, reformat, or "helpfully" adapt it. If the source .txt file ever
 * needs to change, that's a deliberate content edit made directly to that
 * file — never logic in this file.
 *
 * Two things are handled OUTSIDE the system prompt, in the user-turn
 * message instead (see buildUserMessage below), so the system prompt
 * itself never needs to change:
 *
 *  1. Mode hint — when the person picks a specific mode in the UI
 *     (Image/Video/Coding/etc. instead of Auto Detect), we mention the
 *     matching strategy letter (A/B/C/E/F/G) from the system prompt as a
 *     hint in the user message. On "Auto Detect" we add no hint at all,
 *     leaving strategy selection entirely to the model, per the system
 *     prompt's own "Prompt Architect" philosophy.
 *  2. Output language — the system prompt's GOLDEN_RULE already defaults
 *     to English "unless explicitly requested otherwise by the user."
 *     When the person picks a language in PromptBani's UI, we add that
 *     explicit request as a line in the user message — again, without
 *     touching the system prompt's own wording.
 *
 * KNOWN LIMITATION: the system prompt allows the model to ask a
 * clarifying question instead of the two-block output when a request is
 * ambiguous ("Exception for Ambiguity"). Since this extension sends a
 * single one-shot request (no back-and-forth turns), a clarifying
 * question — if the model chooses to ask one — will come back as plain
 * text instead of the optimized prompt. This is inherent to reusing a
 * conversational system prompt in a single-shot tool, not something this
 * codebase works around.
 */

export function buildSystemPrompt(): string {
  return PROMPTBANI_SYSTEM_PROMPT;
}

const STRATEGY_HINTS: Record<Exclude<PromptMode, "auto">, string> = {
  image: "Strategy B (Advanced Image Generation Prompt)",
  video: "Strategy C (Advanced Video Generation Prompt)",
  coding: "Strategy A (Original Structured Prompt Generation), adapted for a coding/technical task",
  writing: "Strategy A (Original Structured Prompt Generation), adapted for a writing/content task",
  json: "Strategy F (Advanced JSON-Based Prompt Generation)",
  "html-tags": "Strategy G (HTML-like Tagging System)",
  freestyle: "Strategy E (Freestyle Prompt Generation)",
};

/**
 * Builds the user-turn message sent alongside the (untouched) system
 * prompt. This is the only place PromptBani's UI selections (mode,
 * language) get communicated to the model.
 */
export function buildUserMessage(
  rawPrompt: string,
  mode: PromptMode = "auto",
  language: PromptLanguage = "auto"
): string {
  const lines = [`Optimize the following prompt:\n"""\n${rawPrompt.trim()}\n"""`];

  if (mode !== "auto") {
    lines.push(`Preferred strategy for this request: ${STRATEGY_HINTS[mode]}.`);
  }

  if (language !== "auto") {
    const languageName = LANGUAGE_NAMES[language];
    lines.push(
      `Please write the main prompt and negative prompt in ${languageName}. (This is my explicit language request per your GOLDEN_RULE — the mandatory PromptBani Footer should still follow your own rule of matching the language of my original input above.)`
    );
  }

  return lines.join("\n\n");
}
