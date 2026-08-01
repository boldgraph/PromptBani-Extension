import type { PlatformAdapter } from "./types";
import { chatGptAdapter } from "./chatgpt";
import { geminiAdapter } from "./gemini";
import { claudeAdapter } from "./claude";
import { grokAdapter } from "./grok";
import { perplexityAdapter } from "./perplexity";
import { copilotAdapter } from "./copilot";
import { deepseekAdapter } from "./deepseek";

/**
 * Registry of all supported platform adapters.
 *
 * To add a new AI website: create `src/content/adapters/<site>.ts`
 * implementing `PlatformAdapter`, then add it to this array. Nothing
 * else in the codebase needs to change. See README.md → "Adding a new
 * AI website" for a full walkthrough.
 */
export const ADAPTERS: PlatformAdapter[] = [
  chatGptAdapter,
  geminiAdapter,
  claudeAdapter,
  grokAdapter,
  perplexityAdapter,
  copilotAdapter,
  deepseekAdapter,
];

export function getActiveAdapter(hostname: string): PlatformAdapter | null {
  return ADAPTERS.find((adapter) => adapter.matches(hostname)) ?? null;
}

export type { PlatformAdapter };
