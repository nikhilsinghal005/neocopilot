## Webview Chat UI

Production-oriented React + Vite + Tailwind interface embedded inside the VS Code extension (delivered to `out/webview-ui`).

### Objectives
Provide a modular, testable, and performant chat interface supporting:
* Streaming messages
* Rich markdown & code highlighting
* Context-driven code assistance

### Directory Highlights
```
src/
  config/              # Runtime/environment config (env.ts)
  features/
    chat/              # Chat domain (components, hooks, state)
  shared/              # Reusable UI + types
  integration/         # VS Code bridge (postMessage APIs, etc.)
```

### Key Conventions
* Path aliases via `tsconfig.json` (`@chat`, `@features`, `@shared`, `@config`).
* Barrel exports for chat components (`features/chat/components/index.ts`).
* Central runtime config: `src/config/env.ts` (exposes `runtimeConfig`).
* Production build: sourcemaps disabled, vendor chunk separated.
* `.editorconfig` ensures consistent formatting.

### Scripts
| Script | Purpose |
| ------ | ------- |
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Generate production bundle (used by extension) |
| `npm run preview` | Preview built assets locally |
| `npm run lint` | Run ESLint over sources |
| `npm run type-check` | Strict TypeScript diagnostics |

### Runtime Config & Env
Add variables prefixed with `VITE_` in a `.env` file (e.g. `VITE_APP_VERSION=0.1.0`). Access through:
```ts
import { runtimeConfig } from '@config/env';
console.log(runtimeConfig.version);
```

### Import Examples
```ts
import { ChatContainer } from '@chat/components';
import { useChatContext } from '@chat/state/chatTypes';
import { runtimeConfig } from '@config/env';
```

### Improving Bundle Size (Next Steps)
Current bundle (~1.3 MB) includes markdown + syntax highlighting libs. Recommended:
1. Dynamic import heavy markdown / highlighting modules.
2. Replace `react-syntax-highlighter` with on-demand Prism + minimal languages.
3. Tree-shake unused icon sets / reduce icon packs.
4. Add `@vscode/webview-ui-toolkit` components only where needed.

### Suggested Enhancements (Roadmap)
* Tests: Add Vitest + React Testing Library & a smoke test suite.
* Error Boundaries: Wrap top-level routes / message renderer.
* Accessibility: ARIA roles for virtualized list, focus management on new message.
* Performance: Virtualize long message lists (react-window already present—integrate in `MessageList`).
* State Management: Consider reducer or external store if chat state grows (Zustand/Jotai).
* Telemetry Abstraction: Provide no-op interface for extension analytics injection.
* Theming: Consolidate Tailwind tokens + VS Code theme variables mapping.

### Coding Guidelines
* Prefer functional components + hooks.
* Keep side effects isolated in hooks (e.g. streaming, clipboard, paste handlers).
* Avoid deep relative imports—use aliases unless causing build friction (then refactor gradually).
* Type all public component props; derive internal types from domain models.

### Development Loop
1. Run `npm run dev` (HMR webview context).
2. Launch extension host that loads built assets or dev server proxy.
3. Iterate with story-like isolated component usage (optional: add Storybook later).

### Handling Messages & Input
`InputBar` + `InputBarUtils` encapsulate throttling, sanitization, and upload handling. Consider extracting a `useChatComposer` hook for clearer separation of concerns.

### License
See root repository `LICENSE.txt`.

---
Maintained as part of the NeoCopilot extension. Keep PRs focused: structure, performance, or UX—not all at once.
