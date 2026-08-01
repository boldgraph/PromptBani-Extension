import { useEffect, useState } from "react";
import { ModeSelector } from "../components/ModeSelector";
import { PROMPT_LANGUAGES } from "../utils/constants";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type PromptBaniSettings } from "../utils/storage";

const MODEL_PRESETS = [
  { value: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku (fast & cheap)" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o mini" },
  { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash" },
  { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
];

export function Popup() {
  const [settings, setSettings] = useState<PromptBaniSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setCustomModel(!MODEL_PRESETS.some((p) => p.value === s.model));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme =
      settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : settings.theme;
  }, [settings.theme]);

  async function update(partial: Partial<PromptBaniSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    await saveSettings(partial);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }

  if (!loaded) {
    return <div className="pb-app pb-app--loading">Loading…</div>;
  }

  return (
    <div className="pb-app">
      <header className="pb-header">
        <span className="pb-logo">✨</span>
        <div>
          <h1>PromptBani</h1>
          <p>Optimize any AI prompt in one click</p>
        </div>
      </header>

      <section className="pb-section">
        <label className="pb-field-label" htmlFor="pb-api-key">
          OpenRouter API key
        </label>
        <input
          id="pb-api-key"
          type="password"
          placeholder="sk-or-v1-..."
          value={settings.apiKey}
          onChange={(e) => update({ apiKey: e.target.value })}
          autoComplete="off"
        />
        <p className="pb-hint">
          Get a free key at{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
            openrouter.ai/keys
          </a>
          . Stored only in your browser, never sent anywhere except OpenRouter.
        </p>
      </section>

      <section className="pb-section">
        <label className="pb-field-label" htmlFor="pb-model">
          AI model
        </label>
        <select
          id="pb-model"
          value={customModel ? "__custom__" : settings.model}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustomModel(true);
              return;
            }
            setCustomModel(false);
            update({ model: e.target.value });
          }}
        >
          {MODEL_PRESETS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value="__custom__">Custom model ID…</option>
        </select>
        {customModel && (
          <input
            className="pb-custom-model"
            type="text"
            placeholder="e.g. mistralai/mistral-large"
            value={settings.model}
            onChange={(e) => update({ model: e.target.value })}
          />
        )}
        <p className="pb-hint">
          Any{" "}
          <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">
            OpenRouter model ID
          </a>{" "}
          works here.
        </p>
      </section>

      <section className="pb-section">
        <span className="pb-field-label">Default mode</span>
        <ModeSelector value={settings.defaultMode} onChange={(mode) => update({ defaultMode: mode })} />
      </section>

      <section className="pb-section">
        <label className="pb-field-label" htmlFor="pb-language">
          Default output language
        </label>
        <select
          id="pb-language"
          value={settings.language}
          onChange={(e) => update({ language: e.target.value as PromptBaniSettings["language"] })}
        >
          {PROMPT_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="pb-hint">
          You can also change this per-optimization from the ⚙ button next to the Optimize
          button on any supported site.
        </p>
      </section>

      <section className="pb-section">
        <span className="pb-field-label">Optimized output</span>
        <label className="pb-toggle">
          <input
            type="radio"
            name="pb-output-mode"
            checked={settings.replaceOriginal}
            onChange={() => update({ replaceOriginal: true })}
          />
          Replace original prompt
        </label>
        <label className="pb-toggle">
          <input
            type="radio"
            name="pb-output-mode"
            checked={!settings.replaceOriginal}
            onChange={() => update({ replaceOriginal: false })}
          />
          Copy optimized prompt only
        </label>
      </section>

      <section className="pb-section">
        <span className="pb-field-label">Theme</span>
        <div className="pb-theme-row">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`pb-theme-btn ${settings.theme === t ? "active" : ""}`}
              onClick={() => update({ theme: t })}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <footer className="pb-footer">
        <span className={`pb-saved ${savedFlash ? "visible" : ""}`}>Saved</span>
        <a
          className="pb-sponsor"
          href="https://github.com/boldgraph/PromptBani"
          target="_blank"
          rel="noreferrer"
        >
          ☕️ Support PromptBani
        </a>
      </footer>
    </div>
  );
}
