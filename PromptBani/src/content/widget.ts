import { MESSAGE_TYPES, PROMPT_LANGUAGES, PROMPT_MODES, type PromptLanguage, type PromptMode } from "../utils/constants";
import { getSettings, saveSettings } from "../utils/storage";
import { guessMode } from "../utils/detectMode";
import { parsePromptBaniResponse, composerTextFrom } from "../utils/parsePromptBaniResponse";
import type { PlatformAdapter } from "./adapters/types";

const WIDGET_STYLES = `
:host { all: initial; }
.pb-root {
  position: relative;
  display: inline-flex;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  z-index: 2147483000;
}
.pb-button-group {
  display: inline-flex;
  align-items: stretch;
}
.pb-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px 0 0 999px;
  border: 1px solid var(--pb-border, rgba(140,110,255,0.35));
  border-right: none;
  background: var(--pb-bg, linear-gradient(135deg, #7c5cff, #ff6ec7));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1;
  white-space: nowrap;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.pb-button:hover { transform: translateY(-1px); opacity: 0.92; }
.pb-button:disabled { opacity: 0.6; cursor: progress; transform: none; }
.pb-settings-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  border-radius: 0 999px 999px 0;
  border: 1px solid var(--pb-border, rgba(140,110,255,0.35));
  background: var(--pb-bg, linear-gradient(135deg, #7c5cff, #ff6ec7));
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  transition: transform 0.12s ease, opacity 0.12s ease;
}
.pb-settings-toggle:hover { opacity: 0.92; }
.pb-settings-toggle[data-open="true"] { opacity: 0.85; }
.pb-panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: var(--pb-panel-bg, #1c1c22);
  color: var(--pb-panel-fg, #f2f2f5);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.35);
  padding: 14px;
  font-size: 13px;
}
.pb-panel[data-theme="light"] {
  --pb-panel-bg: #ffffff;
  --pb-panel-fg: #1c1c22;
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  border-color: rgba(0,0,0,0.08);
}
.pb-title {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pb-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  margin: 10px 0 6px;
}
.pb-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  max-height: 160px;
  overflow-y: auto;
}
.pb-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
.pb-mode-option:hover { background: rgba(124,92,255,0.15); }
.pb-mode-option input { accent-color: #7c5cff; }
.pb-toggle-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 12px;
}
.pb-select {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--pb-border, rgba(140,110,255,0.35));
  background: var(--pb-input-bg, rgba(255,255,255,0.06));
  color: inherit;
  font-size: 12.5px;
}
.pb-panel[data-theme="light"] .pb-select {
  --pb-input-bg: rgba(0,0,0,0.04);
}
.pb-status {
  margin-top: 8px;
  font-size: 11.5px;
  line-height: 1.4;
}
.pb-status.error { color: #ff7a7a; }
.pb-status.success { color: #6ee7a4; }
.pb-toast {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  max-width: 220px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.4;
  background: var(--pb-panel-bg, #1c1c22);
  color: var(--pb-panel-fg, #f2f2f5);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}
.pb-toast[data-theme="light"] {
  background: #ffffff;
  color: #1c1c22;
  border-color: rgba(0,0,0,0.08);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}
.pb-toast.error { color: #ff7a7a; }
.pb-toast.success { color: #6ee7a4; }
`;

interface WidgetState {
  mode: PromptMode;
  language: PromptLanguage;
  replaceOriginal: boolean;
  panelOpen: boolean;
  busy: boolean;
  statusMessage: string | null;
  statusType: "idle" | "error" | "success";
  /** The last raw idea PromptBani actually optimized (before insertion). */
  lastRawPrompt: string | null;
  /** What we last wrote into the composer, so we can detect "untouched since". */
  lastInsertedText: string | null;
}

/**
 * Mounts the PromptBani button + floating menu next to a chat composer,
 * using a Shadow DOM so none of our styles leak into (or clash with) the
 * host page's own CSS.
 */
export function mountPromptBaniWidget(adapter: PlatformAdapter, composer: HTMLElement): void {
  const anchor = adapter.getAnchor(composer);
  if (!anchor || anchor.querySelector?.(".promptbani-host")) return;

  const host = document.createElement("span");
  host.className = "promptbani-host";
  host.style.display = "inline-flex";
  host.style.verticalAlign = "middle";
  host.style.marginLeft = "6px";

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = WIDGET_STYLES;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "pb-root";
  shadow.appendChild(root);

  const state: WidgetState = {
    mode: "auto",
    language: "auto",
    replaceOriginal: true,
    panelOpen: false,
    busy: false,
    statusMessage: null,
    statusType: "idle",
    lastRawPrompt: null,
    lastInsertedText: null,
  };

  getSettings().then((settings) => {
    state.mode = settings.defaultMode;
    state.language = settings.language;
    state.replaceOriginal = settings.replaceOriginal;
    render();
  });

  function render(): void {
    root.innerHTML = "";

    const group = document.createElement("div");
    group.className = "pb-button-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "pb-button";
    button.disabled = state.busy;
    button.title = "Optimize using your current mode & output settings";
    button.textContent = state.busy ? "⏳ Optimizing…" : "✨ Optimize Prompt";
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Clicking the main button optimizes immediately with whatever
      // mode/output settings are currently active — no menu in the way.
      void handleOptimize();
    });
    group.appendChild(button);

    const settingsToggle = document.createElement("button");
    settingsToggle.type = "button";
    settingsToggle.className = "pb-settings-toggle";
    settingsToggle.setAttribute("data-open", String(state.panelOpen));
    settingsToggle.setAttribute("aria-label", "PromptBani settings");
    settingsToggle.title = "Mode & output settings";
    settingsToggle.textContent = "⚙";
    settingsToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // The gear only opens/closes the settings menu — it never triggers
      // an optimization itself.
      state.panelOpen = !state.panelOpen;
      state.statusMessage = null;
      render();
    });
    group.appendChild(settingsToggle);

    root.appendChild(group);

    if (state.panelOpen) {
      root.appendChild(renderPanel());
    } else if (state.statusMessage) {
      const currentMessage = state.statusMessage;
      root.appendChild(renderToast());
      window.setTimeout(() => {
        if (state.statusMessage === currentMessage && !state.panelOpen) {
          state.statusMessage = null;
          render();
        }
      }, 4000);
    }
  }

  function renderToast(): HTMLElement {
    const toast = document.createElement("div");
    toast.className = `pb-toast ${state.statusType}`;
    toast.textContent = state.statusMessage ?? "";
    getSettings().then((s) => toast.setAttribute("data-theme", resolveTheme(s.theme)));
    return toast;
  }

  function renderPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "pb-panel";

    getSettings().then((s) => panel.setAttribute("data-theme", resolveTheme(s.theme)));

    const title = document.createElement("div");
    title.className = "pb-title";
    title.textContent = "PromptBani";
    panel.appendChild(title);

    const modeLabel = document.createElement("div");
    modeLabel.className = "pb-label";
    modeLabel.textContent = "Mode";
    panel.appendChild(modeLabel);

    const modesGrid = document.createElement("div");
    modesGrid.className = "pb-modes";
    for (const { value, label } of PROMPT_MODES) {
      const optionLabel = document.createElement("label");
      optionLabel.className = "pb-mode-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "promptbani-mode";
      radio.checked = state.mode === value;
      radio.addEventListener("change", () => {
        state.mode = value;
        saveSettings({ defaultMode: value });
        render();
      });

      optionLabel.appendChild(radio);
      optionLabel.appendChild(document.createTextNode(label));
      modesGrid.appendChild(optionLabel);
    }
    panel.appendChild(modesGrid);

    const languageLabel = document.createElement("div");
    languageLabel.className = "pb-label";
    languageLabel.textContent = "Output language";
    panel.appendChild(languageLabel);

    const languageSelect = document.createElement("select");
    languageSelect.className = "pb-select";
    for (const { value, label } of PROMPT_LANGUAGES) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = state.language === value;
      languageSelect.appendChild(option);
    }
    languageSelect.addEventListener("change", () => {
      state.language = languageSelect.value as PromptLanguage;
      saveSettings({ language: state.language });
    });
    panel.appendChild(languageSelect);

    const optionsLabel = document.createElement("div");
    optionsLabel.className = "pb-label";
    optionsLabel.textContent = "Output";
    panel.appendChild(optionsLabel);

    const replaceRow = document.createElement("label");
    replaceRow.className = "pb-toggle-row";
    const replaceRadio = document.createElement("input");
    replaceRadio.type = "radio";
    replaceRadio.name = "promptbani-output";
    replaceRadio.checked = state.replaceOriginal;
    replaceRadio.addEventListener("change", () => {
      state.replaceOriginal = true;
      saveSettings({ replaceOriginal: true });
      render();
    });
    replaceRow.appendChild(replaceRadio);
    replaceRow.appendChild(document.createTextNode("Replace original prompt"));
    panel.appendChild(replaceRow);

    const copyRow = document.createElement("label");
    copyRow.className = "pb-toggle-row";
    const copyRadio = document.createElement("input");
    copyRadio.type = "radio";
    copyRadio.name = "promptbani-output";
    copyRadio.checked = !state.replaceOriginal;
    copyRadio.addEventListener("change", () => {
      state.replaceOriginal = false;
      saveSettings({ replaceOriginal: false });
      render();
    });
    copyRow.appendChild(copyRadio);
    copyRow.appendChild(document.createTextNode("Copy optimized prompt only"));
    panel.appendChild(copyRow);

    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "pb-button";
    cta.style.width = "100%";
    cta.style.marginTop = "12px";
    cta.style.borderRadius = "10px";
    cta.style.justifyContent = "center";
    cta.disabled = state.busy;
    cta.textContent = state.busy ? "Optimizing…" : "Optimize now";
    cta.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void handleOptimize();
    });
    panel.appendChild(cta);

    if (state.statusMessage) {
      const status = document.createElement("div");
      status.className = `pb-status ${state.statusType}`;
      status.textContent = state.statusMessage;
      panel.appendChild(status);
    }

    return panel;
  }

  async function handleOptimize(): Promise<void> {
    const composerValue = adapter.getValue(composer);

    // If the composer still holds exactly what we last inserted, the user
    // hasn't typed anything new — they're likely just changing the mode
    // or language and re-running. Re-optimize their ORIGINAL idea instead
    // of feeding our own previous output back in as if it were new raw
    // input (which produced confusing "nothing changed" results).
    const rawPrompt =
      state.lastRawPrompt && composerValue === state.lastInsertedText
        ? state.lastRawPrompt
        : composerValue;

    if (!rawPrompt) {
      state.statusMessage = "Type a prompt in the input box first.";
      state.statusType = "error";
      render();
      return;
    }

    state.busy = true;
    state.statusMessage = null;
    render();

    const effectiveMode: PromptMode = state.mode === "auto" ? guessAndKeepAuto(rawPrompt) : state.mode;

    try {
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.OPTIMIZE_PROMPT,
        payload: { rawPrompt, mode: effectiveMode, language: state.language },
      });

      if (response?.type === MESSAGE_TYPES.OPTIMIZE_ERROR) {
        throw new Error(response.error ?? "Failed to optimize prompt.");
      }

      // The model's response follows PromptBani's mandated two-code-block
      // + signature format (see promptbani-system-source.txt). Extract
      // just the prompt text that actually belongs in a chat input box.
      const parsed = parsePromptBaniResponse(response.optimizedPrompt as string);
      const composerText = composerTextFrom(parsed);
      const engineLabel = describeEngine(response.engine);

      state.lastRawPrompt = rawPrompt;

      if (state.replaceOriginal) {
        adapter.setValue(composer, composerText);
        state.lastInsertedText = composerText;
        state.statusMessage = `Prompt optimized and inserted${engineLabel}.`;
      } else {
        await navigator.clipboard.writeText(composerText);
        // Not inserted into the composer, so don't treat its current text
        // as "our own output" for next time.
        state.lastInsertedText = null;
        state.statusMessage = `Optimized prompt copied${engineLabel}.`;
      }
      state.statusType = "success";
      state.panelOpen = false;
    } catch (err) {
      state.statusMessage = err instanceof Error ? err.message : "Something went wrong.";
      state.statusType = "error";
    } finally {
      state.busy = false;
      render();
    }
  }

  // "Auto Detect" always stays "auto" for the actual API call — the model
  // itself decides the strategy (see promptbani-system.ts). The local
  // guess is only used for a quick future UI hint and is otherwise
  // unused today; kept explicit so intent is clear at the call site.
  function guessAndKeepAuto(rawPrompt: string): PromptMode {
    void guessMode(rawPrompt);
    return "auto";
  }

  function describeEngine(engine: string | undefined): string {
    switch (engine) {
      case "openrouter":
        return " via your OpenRouter model";
      case "chrome-ai":
        return " via Chrome's on-device AI";
      case "template":
        return " using the offline template (no AI key/model available)";
      default:
        return "";
    }
  }

  document.addEventListener("click", (e) => {
    if (!host.contains(e.target as Node)) {
      if (state.panelOpen) {
        state.panelOpen = false;
        render();
      }
    }
  });

  render();
  anchor.appendChild(host);
}

function resolveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
