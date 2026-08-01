import { PROMPT_MODES, type PromptMode } from "../utils/constants";

interface ModeSelectorProps {
  value: PromptMode;
  onChange: (mode: PromptMode) => void;
}

/**
 * Radio-button grid for picking the default optimization mode. Shared
 * between the extension's action popup (settings) — the injected
 * in-page widget renders its own lightweight vanilla-DOM version to
 * avoid bundling React into every host page (see content/widget.ts).
 */
export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="pb-mode-selector" role="radiogroup" aria-label="Default optimization mode">
      {PROMPT_MODES.map((mode) => (
        <label key={mode.value} className="pb-mode-selector__option">
          <input
            type="radio"
            name="promptbani-default-mode"
            checked={value === mode.value}
            onChange={() => onChange(mode.value)}
          />
          <span>{mode.label}</span>
        </label>
      ))}
    </div>
  );
}
