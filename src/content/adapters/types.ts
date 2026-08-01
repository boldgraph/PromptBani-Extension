/**
 * Contract every platform adapter must implement.
 *
 * Adapters are intentionally dumb: they only know how to *find* a site's
 * prompt input and how to *read/write* its value. All optimization logic
 * lives elsewhere (background worker + prompts module), so adding support
 * for a new AI website never touches business logic.
 */
export interface PlatformAdapter {
  /** Unique id, used for logging/debugging. */
  id: string;

  /** Human-readable name shown nowhere critical, just for logs. */
  name: string;

  /** Returns true if this adapter should be active on the current page. */
  matches(hostname: string): boolean;

  /**
   * Finds the current chat composer element (textarea or contenteditable
   * div). Returns null if not found yet — the caller retries via
   * MutationObserver since most of these sites render the composer async.
   */
  findComposer(): HTMLElement | null;

  /** Reads the current text value out of the composer. */
  getValue(composer: HTMLElement): string;

  /**
   * Writes text into the composer in a way the site's own framework
   * (React/Angular/etc.) recognizes, by dispatching the input events the
   * framework listens for.
   */
  setValue(composer: HTMLElement, text: string): void;

  /**
   * Returns the element PromptBani's button should be anchored near
   * (typically the composer's toolbar/parent). Defaults to the composer
   * itself if not overridden.
   */
  getAnchor(composer: HTMLElement): HTMLElement;
}

/** Fires the input/change events most SPA frameworks listen for. */
export function dispatchInputEvents(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Sets a native input/textarea value using the native setter so React's
 * synthetic-event system detects the change (a plain `el.value = x` is
 * silently ignored by React-controlled inputs).
 */
export function setNativeValue(
  el: HTMLTextAreaElement | HTMLInputElement,
  value: string
): void {
  const prototype = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  descriptor?.set?.call(el, value);
  dispatchInputEvents(el);
}

/** Sets a contenteditable element's text content and notifies listeners. */
export function setContentEditableValue(el: HTMLElement, value: string): void {
  el.focus();
  // Clear existing content, then insert as a single text node/paragraph.
  el.innerHTML = "";
  const lines = value.split("\n");
  lines.forEach((line, i) => {
    const p = document.createElement("p");
    p.textContent = line.length > 0 ? line : "\u200b";
    el.appendChild(p);
    if (i < lines.length - 1) {
      // no-op: each line is its own <p>, matching how most contenteditable
      // chat composers (ProseMirror/Slate-based) represent paragraphs.
    }
  });
  dispatchInputEvents(el);
}
