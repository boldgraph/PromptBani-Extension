import { OPENROUTER_ENDPOINT } from "../utils/constants";

export interface OpenRouterRequest {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userMessage: string;
}

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

/**
 * Calls OpenRouter's OpenAI-compatible chat completions endpoint.
 * This is the ONLY place in the codebase that talks to the network for
 * prompt optimization — everything else is UI or plumbing.
 */
export async function callOpenRouter({
  apiKey,
  model,
  systemPrompt,
  userMessage,
}: OpenRouterRequest): Promise<string> {
  if (!apiKey) {
    throw new OpenRouterError(
      "No OpenRouter API key set. Add one in the PromptBani popup settings."
    );
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // OpenRouter uses these optional headers for its public leaderboard
        // attribution — harmless to include, safe to omit.
        "HTTP-Referer": "https://github.com/boldgraph/PromptBani",
        "X-Title": "PromptBani",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
      }),
    });
  } catch (networkErr) {
    throw new OpenRouterError(
      `Network error reaching OpenRouter: ${(networkErr as Error).message}`
    );
  }

  const data = (await response.json().catch(() => null)) as OpenRouterChatResponse | null;

  if (!response.ok) {
    throw new OpenRouterError(
      data?.error?.message ?? `OpenRouter request failed (HTTP ${response.status}).`,
      response.status
    );
  }

  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new OpenRouterError("OpenRouter returned an empty response.");
  }

  return content;
}
