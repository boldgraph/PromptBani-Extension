# PromptBani ✨

> Built on top of the [PromptBani system prompt](https://github.com/boldgraph/PromptBani)
> by [@amirvazirbani](https://instagram.com/amirvazirbani). This repo contains the
> **browser extension** that automates using that prompt; the prompt itself (and its
> separate commercial license) lives in the main repo.

A free, open-source browser extension that adds an **"✨ Optimize Prompt"** button
next to the chat input box on ChatGPT, Gemini, Claude, Grok, Perplexity, Copilot,
and DeepSeek. One click rewrites your rough idea into a professionally engineered
prompt — no prompt-engineering knowledge required.

PromptBani is a Manifest V3 Chrome extension built with React, TypeScript, and Vite.
It has no backend, no login, no analytics, and no payment system. You bring your own
free [OpenRouter](https://openrouter.ai) API key, and every request goes straight
from your browser to OpenRouter.

---

## How it works

1. You type a rough prompt into any supported AI site's input box.
2. Click the **✨ Optimize Prompt** button PromptBani injects next to it — this
   runs optimization immediately using your current mode/output settings, no
   menu in the way.
3. Need to change mode or output behavior first? Click the small **⚙** button
   next to it to open the settings panel (mode picker, Replace/Copy toggle,
   and an "Optimize now" button), without triggering an optimization.
4. The content script sends your text to the background service worker, which
   calls OpenRouter with the PromptBani system prompt and your chosen model.
5. The optimized prompt is inserted straight into the input box (or copied to
   your clipboard, if you prefer), with a small confirmation toast.

```
chat input box            content script            background worker           OpenRouter
     │  raw prompt              │                            │                        │
     ├─────────────────────────▶│  chrome.runtime.sendMessage │                        │
     │                          ├───────────────────────────▶│  POST /chat/completions │
     │                          │                             ├───────────────────────▶│
     │                          │                             │◀───────────────────────┤
     │◀─────────────────────────┤◀────────────────────────────┤                        │
     │  optimized prompt inserted                                                      │
```

---

## Installation (for users)

PromptBani isn't published to the Chrome Web Store yet — install it as an unpacked
extension:

1. Download or clone this repository.
2. Run the build (see [Development setup](#development-setup) below) to produce a
   `dist/` folder, **or** grab a pre-built `dist.zip` from the
   [Releases](https://github.com/boldgraph/PromptBani-Extension/releases) page and unzip it.
3. Open `chrome://extensions` in Chrome (or `edge://extensions` in Edge).
4. Turn on **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the `dist/` folder.
6. Click the PromptBani icon in your toolbar and paste in an
   [OpenRouter API key](https://openrouter.ai/keys) (free tier available).
7. Visit ChatGPT, Claude, Gemini, or any supported site — the ✨ button appears
   next to the chat input automatically.

---

## Development setup

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/boldgraph/PromptBani.git
cd PromptBani
npm install
```

### Build

```bash
npm run build
```

This runs in three passes (popup, content script, background worker) because MV3
content scripts and service workers must ship as self-contained, non-module
bundles, while the popup is a normal Vite HTML+React app:

| Step | Config | Output |
|---|---|---|
| Popup UI | `vite.popup.config.ts` | `dist/popup/` |
| Content script | `vite.content.config.ts` | `dist/content/content.js` |
| Background worker | `vite.background.config.ts` | `dist/background/background.js` |

`scripts/copy-static.js` then copies `manifest.json` and `public/icons/` into
`dist/`. Load `dist/` as an unpacked extension in Chrome to test your changes —
reload the extension (and refresh any open AI chat tab) after each build.

### Watch mode

```bash
npm run dev
```

Rebuilds on file changes. You still need to click the reload icon on
`chrome://extensions` after each rebuild (Chrome doesn't hot-reload extensions).

### Type-check only

```bash
npm run type-check
```

### Package a zip for distribution

```bash
npm run build
npm run zip
```

Produces `promptbani.zip` (requires the `zip` CLI to be installed on your system —
available by default on macOS/Linux; on Windows, just right-click the `dist`
folder → **Send to → Compressed (zipped) folder** instead, or install `zip` via
a package manager).

---

## Project structure

```
PromptBani/
├── src/
│   ├── components/       # Shared React components (e.g. ModeSelector)
│   ├── content/           
│   │   ├── adapters/      # One file per supported AI website
│   │   ├── widget.ts       # Injected button + floating menu (vanilla DOM, Shadow DOM–isolated)
│   │   └── index.ts        # Content script entry point
│   ├── background/
│   │   └── index.ts        # Service worker: receives requests, calls OpenRouter
│   ├── popup/
│   │   ├── Popup.tsx        # Settings UI (API key, model, default mode, theme)
│   │   ├── Popup.css
│   │   ├── main.tsx
│   │   └── index.html
│   ├── prompts/
│   │   └── promptbani-system.ts   # The PromptBani system prompt & strategies
│   ├── api/
│   │   └── openrouter.ts    # OpenRouter API client
│   └── utils/
│       ├── constants.ts
│       ├── storage.ts       # chrome.storage.sync wrapper
│       └── detectMode.ts    # Local heuristic hint for Auto Detect
├── public/icons/
├── manifest.json
├── vite.popup.config.ts
├── vite.content.config.ts
├── vite.background.config.ts
└── scripts/
    ├── copy-static.js
    └── zip.js
```

**Why a vanilla-DOM widget instead of React inside the content script?**
Bundling React into every page you visit (ChatGPT, Gemini, etc.) adds real
weight and risks colliding with the host page's own React instance. Instead,
`src/content/widget.ts` renders the button and floating menu with plain DOM
APIs inside a **Shadow DOM**, which keeps it fast, dependency-free, and fully
isolated from host page styles. React is used only where it earns its keep:
the extension's own settings popup.

---

## Why the two-step optimization design?

The original PromptBani system prompt (see `src/prompts/promptbani-system.ts`
header comment) was written for a chat conversation, where it returns two
Markdown code blocks (prompt + negative prompt) plus a signature footer. Since
PromptBani-the-extension needs to paste a result directly into a text box, the
adapted prompt asks the model to return **only** the optimized prompt text —
with a trailing `Negative Prompt:` line added automatically, but only for
Image/Video modes where a negative prompt is meaningful.

---

## Adding a new AI website

Adapters are the only site-specific code in PromptBani — everything else
(optimization logic, UI, settings) is shared.

1. Create `src/content/adapters/<site>.ts`:

   ```ts
   import type { PlatformAdapter } from "./types";
   import { setNativeValue } from "./types";

   export const mySiteAdapter: PlatformAdapter = {
     id: "mysite",
     name: "My Site",

     matches(hostname) {
       return hostname === "chat.mysite.com";
     },

     findComposer() {
       return document.querySelector<HTMLTextAreaElement>("textarea#composer");
     },

     getValue(composer) {
       return (composer as HTMLTextAreaElement).value.trim();
     },

     setValue(composer, text) {
       setNativeValue(composer as HTMLTextAreaElement, text);
     },

     getAnchor(composer) {
       return composer.closest("form") ?? composer.parentElement ?? composer;
     },
   };
   ```

2. Register it in `src/content/adapters/index.ts`:

   ```ts
   import { mySiteAdapter } from "./mysite";
   export const ADAPTERS: PlatformAdapter[] = [
     // ...existing adapters,
     mySiteAdapter,
   ];
   ```

3. Add the site's URL pattern to `content_scripts.matches` (and, if you want the
   toolbar icon to appear there too, `web_accessible_resources.matches`) in
   `manifest.json`.

4. Rebuild (`npm run build`) and reload the extension.

**Tip:** if the composer is a `contenteditable` div (ProseMirror/Slate-style,
common on ChatGPT/Gemini/Claude), use `setContentEditableValue` from
`./types` instead of `setNativeValue`.

---

## Changing the AI model

Users can change the model anytime from the extension popup — no rebuild
needed. Any [OpenRouter model ID](https://openrouter.ai/models) works
(`anthropic/claude-3.5-haiku`, `openai/gpt-4o-mini`, `google/gemini-2.0-flash-001`,
`meta-llama/llama-3.3-70b-instruct`, etc.), including custom/free-tier models
via the "Custom model ID…" option.

To change the **default** model shipped to first-time users, edit
`DEFAULT_MODEL` in `src/utils/constants.ts`.

---

## Security notes

- The OpenRouter API key is entered by the user in the popup and stored only in
  `chrome.storage.sync` (your own browser/Google account sync) — it is never
  hardcoded, bundled, committed, or sent to any server other than
  `https://openrouter.ai`.
- All OpenRouter calls happen in the background service worker, not in the
  content script, so the key is never exposed to page-context JavaScript on
  ChatGPT/Gemini/etc.
- `host_permissions` is scoped to `https://openrouter.ai/*` only.
- No analytics, telemetry, or third-party tracking of any kind.

---

## Roadmap ideas (not yet implemented)

- Firefox/Safari builds (currently Chromium-based browsers only, via MV3)
- Per-site model overrides
- Prompt history (local-only, opt-in)

---

## 💝 How to Support PromptBani-Extension

You can support PromptBani-Extension in moral and financial ways:

### Moral Support (Best way to support me)
While using PromptBani-Extension, take a screenshot and tag my Instagram page. This is the biggest support you can give me:
*   **Instagram:** [amirvazirbani](https://instagram.com/amirvazirbani)

### Financial Support
For financial support, you can use the following two methods (both inside and outside Iran) to support this project:

| Location | Method | Link |
| :--- | :--- | :--- |
| **Outside Iran** | Tether(TRC20) | [Trust Wallet](https://link.trustwallet.com/send?coin=195&address=TLDuheyotfcfdcFk2RpF3h9FKy2LMQ1Yq6&token_id=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t) |
| **Inside Iran** | coffeebede | [coffeebede.com/promptbani](https://www.coffeebede.com/promptbani) |

## License

- **Extension code** (everything in this repo except the PromptBani system
  prompt text itself) — MIT, see [LICENSE-CODE.md](./LICENSE-CODE.md).
- **The PromptBani system prompt** (`src/prompts/promptbani-system-source.txt`
  and `PromptBani.txt`) — remains under the separate **System Prompt Usage
  License & Commercial Terms**, see [LICENSE](./LICENSE). Personal use is
  free; commercial/API/app embedding requires a paid license — contact
  amirvazirbaniwork@gmail.com.

## 📞 Contact Me

*   **Email:** [amirvazirbaniwork@gmail.com](mailto:amirvazirbaniwork@gmail.com)
*   **GitHub:** [github.com/boldgraph](https://github.com/boldgraph)
*   **Telegram:** [t.me/vazirbani](https://t.me/vazirbani)
*   **Instagram:** [amirvazirbani](https://instagram.com/amirvazirbani)
*   **Linkedin:** [AmirMohammadVazirBani](https://www.linkedin.com/in/amir-mohammad-vazirbani-7924532b8?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)
