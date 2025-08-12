# NeoCopilot

Inline Code Completion & Chat Assistant for VS Code with a modular production-oriented architecture.

<video width="1000" height="575" autoplay loop muted playsinline preload="auto">
    <source src="https://assets.neocopilot.io/videos/inlinevideo.mp4" type="video/mp4" />
    Your browser does not support the video tag.
</video>

## At a Glance

| Capability | Status |
|------------|--------|
| Inline code completions | ✅ Implemented |
| Chat assistant (multi‑message, actions) | ✅ Implemented |
| Inline edit / smart insertion | ✅ Implemented (initial) |
| Settings (provider configs, persistence) | ✅ Implemented (local & postMessage) |
| Multi provider (OpenAI / Azure) | ✅ Pluggable configs |
| Structured logging & status bar notifications | ✅ Core modules present |
| DI / modular core skeleton | 🔄 Partial (extensible scaffolding) |
| Tests (unit/integration) | ⏳ Planned |
| Bundle optimization (code splitting, lazy markdown libs) | ⏳ Planned |
| Telemetry + anonymized metrics | ⏳ Planned |
| Secret handling hardening (secure storage abstraction) | ⏳ Planned |

## Table of Contents

1. Features
2. Architecture Overview
3. Directory Structure
4. Settings & Configuration
5. Development Workflow
6. Build & Packaging
7. Code Quality & Conventions
8. Roadmap / Next Steps
9. Support

## 1. Features

### Code Completion
* Real‑time suggestions (context aware)
* Supports multiple languages (delegates to extension host context)
* Future: provider strategy + ranking pipeline

### Chat Assistant
<video width="1000" height="575" autoplay loop muted playsinline preload="auto">
    <source src="https://assets.neocopilot.io/videos/chatvideo.mp4" type="video/mp4" />
    Your browser does not support the video tag.
</video>
* Insert code blocks directly into editor
* Run shell commands in terminal via action buttons
* Session state & message types structured for future streaming
* Planned: tool invocation, citations, markdown performance tuning

### Inline Edit
* Smart insertion lenses & selection overlay
* Planned: diff preview & accept/reject granularity

### Settings Module
* Provider registry (OpenAI, Azure) with unified state reducer
* Local persistence (localStorage) + `postMessage` sync to extension
* Dirty / saving state, extendable provider configs

## 2. Architecture Overview

High‑level layers:
* `core/` – cross‑cutting concerns (auth, logging, config, events, socket, notifications, workspace utilities)
* `features/` – vertical feature modules (chat, code-completion, inline-edit, settings)
* `shared/` – reusable types, utils, constants
* `webview-chat/` – isolated React + Vite app (UI layer) communicating via `postMessage`

Design principles:
* Isolation: Webview UI has no direct dependency on VS Code API; uses context bridge.
* Testability: Reducers + pure helpers separated (tests to be added under `__tests__`).
* Explicit state flows: Chat + Settings rely on context providers; actions kept minimal and serializable.
* Progressive optimization: Vendor chunk split in build; further code splitting planned.

## 3. Directory Structure (Condensed)

```
src/
    extension.ts                # Activation entry
    core/                       # Cross-cutting modules
    features/
        chat/                     # Chat feature (panel, state, actions)
        code-completion/          # Completion provider wiring
        inline-edit/              # Inline edit lenses & insertion flows
        settings/                 # Settings (React context + provider forms)
    shared/
        types/ utils/ constants/  # Reusable definitions
webview-chat/
    src/
        features/chat/            # Chat UI components & hooks
        features/settings/        # Settings UI (provider forms, state)
        shared/                   # UI shared modules
```

### Settings Feature (webview)
```
features/settings/
    components/ApiConfiguration.tsx
    components/providers/{OpenAi,AzureFoundry}Configuration.tsx
    state/
        SettingsContext.tsx        # Context + provider wrapper
        useSettingsLogic.ts        # Reducer + persistence + actions
        settingsTypes.ts           # Strongly typed provider configs
        usePersistedSettings.ts    # Bridge localStorage + postMessage
```

## 4. Settings & Configuration

Currently stored locally (webview `localStorage`) then mirrored to the extension via `{ command: 'settings:update', payload }`.

Planned enhancements:
* Secure secret storage abstraction (mask at rest)
* Migration layer for schema evolution
* Provider capability metadata (validation rules, required fields)

## 5. Development Workflow

Install dependencies (root + webview if separate):
```
npm install
```

Build extension + webview bundle:
```
npm run build
```

Launch in VS Code debug (F5) – the build script runs prior if not present.

During UI development (faster iteration), optionally run Vite dev inside `webview-chat/` (NOTE: ensure messaging mocks if used):
```
cd webview-chat
npm install
npm run dev
```

## 6. Build & Packaging
* Vite build (manual vendor chunk split, ES2020 target)
* Single JS asset currently ~1.36 MB (gzip ~452 KB) – acceptable for early stage; roadmap includes dynamic imports for markdown & syntax highlight libraries.
* Source maps disabled in production mode (config ready for conditional enabling).

## 7. Code Quality & Conventions
* TypeScript `strict` mode enabled
* Path aliases defined in `webview-chat/tsconfig.json`
* React contexts kept thin; heavy logic moved to dedicated hooks (e.g., `useSettingsLogic`)
* Lint rule exception minimized (only documented where necessary)
* Pending: add Vitest + React Testing Library + snapshot tests for message rendering & reducer behavior

### Suggested Test Targets (Upcoming)
* `settingsReducer` – update and save transitions
* Chat message parsing / action detection
* Code insertion logic (idempotency & placement)

## 8. Roadmap / Next Steps
| Area | Planned Work |
|------|--------------|
| Performance | Lazy-load markdown + prism, split vendor chunk further |
| Security | Secret masking & secure storage provider |
| Telemetry | Anonymous usage metrics (opt-in) |
| Settings UX | Validation, inline error states, environment presets |
| Chat | Streaming tokens, tool execution, multi-tab sessions |
| Inline Edit | Diff preview & partial accept UI |
| AI Providers | Additional (Gemini, Anthropic) plug-in adapters |
| Testing | Unit + integration harness, CI workflow |

## 9. Support
* Website: https://www.neocopilot.io
* Email: [support@neocopilot.io](mailto:support@neocopilot.io)
* Issues / feedback: Open a GitHub Issue (public tracker coming soon)

---

Happy coding with NeoCopilot – contributions & suggestions welcome!
