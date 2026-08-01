import type { PromptLanguage, PromptMode } from "./constants";

/**
 * Tier 3 of PromptBani's optimization pipeline: a pure-JavaScript,
 * no-network, no-AI rewrite. This never fails and needs nothing from the
 * user — it's the guaranteed fallback when neither OpenRouter (Tier 1,
 * requires a user-supplied API key) nor Chrome's on-device model (Tier 2,
 * requires a supported browser/device) are available. In practice, most
 * users without a configured OpenRouter key land here, since Chrome's
 * on-device Prompt API is still gated behind flags for most people — so
 * this tier needs to behave sensibly, including respecting the language
 * picker.
 *
 * IMPORTANT LIMITATION: this tier has no actual language model, so it
 * cannot translate the user's own words. What it CAN do is present the
 * structural scaffolding (field labels like "Task", "Format", "Tone") in
 * the requested language. The user's own prompt content is inserted
 * as-is, in whatever language they typed it in. This is called out
 * explicitly in the UI (see widget.ts describeEngine) so nobody mistakes
 * this for real AI-driven translation.
 */

const NEGATIVE_PROMPT_BASELINE =
  "low quality, blurry, watermark, distorted anatomy, extra limbs, oversaturated, poorly drawn";

interface Labels {
  task: string;
  requirements: string;
  outputFormat: string;
  tone: string;
  format: string;
  instructions: string;
  negativePrompt: string;
  styleMatch: string;
}

const LABELS_EN: Labels = {
  task: "Task",
  requirements: "Requirements",
  outputFormat: "Output format",
  tone: "Tone",
  format: "Format",
  instructions: "Instructions",
  negativePrompt: "Negative Prompt",
  styleMatch: "Match the style implied by the request above.",
};

const LABELS_FA: Labels = {
  task: "وظیفه",
  requirements: "الزامات",
  outputFormat: "فرمت خروجی",
  tone: "لحن",
  format: "قالب",
  instructions: "دستورالعمل",
  negativePrompt: "موارد قابل حذف",
  styleMatch: "سبک رو مطابق با درخواست بالا در نظر بگیر.",
};

// Only languages we can confidently label are translated; everything else
// falls back to English labels rather than risk a wrong translation.
const LABELS_BY_LANGUAGE: Partial<Record<PromptLanguage, Labels>> = {
  en: LABELS_EN,
  fa: LABELS_FA,
};

function getLabels(language: PromptLanguage): Labels {
  return LABELS_BY_LANGUAGE[language] ?? LABELS_EN;
}

export function templateOptimize(
  rawPrompt: string,
  mode: PromptMode,
  language: PromptLanguage = "auto"
): string {
  const task = rawPrompt.trim();
  const effectiveMode = mode === "auto" ? "freestyle" : mode;
  const t = getLabels(language);

  switch (effectiveMode) {
    case "image":
      return [
        `${task}, highly detailed, professional composition, balanced lighting, sharp focus, high resolution`,
        "",
        `${t.negativePrompt}: ${NEGATIVE_PROMPT_BASELINE}`,
      ].join("\n");

    case "video":
      return [
        `${task}, smooth camera movement, cinematic lighting, coherent motion, high resolution`,
        "",
        `${t.negativePrompt}: ${NEGATIVE_PROMPT_BASELINE}, jittery motion, flickering`,
      ].join("\n");

    case "coding":
      return [
        `**${t.task}:** ${task}`,
        `**${t.requirements}:** Write clean, well-commented, production-ready code. State any assumptions you make explicitly rather than guessing silently.`,
        `**${t.outputFormat}:** Return the code in a single code block, followed by a brief explanation of key decisions.`,
      ].join("\n");

    case "writing":
      return [
        `**${t.task}:** ${task}`,
        `**${t.tone}:** Clear, engaging, and appropriate for a general audience.`,
        `**${t.format}:** Well-structured, with a clear opening and closing.`,
      ].join("\n");

    case "json":
      return [
        `**${t.task}:** ${task}`,
        `**${t.outputFormat}:** Respond with a single valid JSON object only — no prose, no markdown code fences, no commentary.`,
      ].join("\n");

    case "html-tags":
      return [
        "<prompt>",
        `  <subject>${task}</subject>`,
        `  <style>${t.styleMatch}</style>`,
        "</prompt>",
      ].join("\n");

    case "freestyle":
    default:
      return [
        `**${t.task}:** ${task}`,
        `**${t.instructions}:** Be specific, thorough, and well-structured in your response. Ask a clarifying question first only if the request is genuinely ambiguous.`,
      ].join("\n");
  }
}
