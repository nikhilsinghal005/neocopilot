## Settings Feature

Production-level settings module for configuring AI API providers (OpenAI, Azure Foundry).

### Goals
* Strong typing for provider-specific configs.
* Central context for read/write + persistence via VS Code message bridge.
* Extensible registry to add new providers without editing switch statements.

### Structure
```
settings/
  components/
    ApiConfiguration.tsx         # Provider selector + renders active provider form
    SettingsView.tsx             # Host view (modal/panel) wrapper
    providers/
      OpenAiConfiguration.tsx    # OpenAI form
      AzureFoundryConfiguration.tsx # Azure Foundry form
  state/
    settingsTypes.ts             # Shared types & schemas
    SettingsContext.tsx          # React context / provider
    usePersistedSettings.ts      # Hook for VS Code persistence bridge
  README.md
  index.ts
```

### Adding a New Provider
1. Create a form component under `components/providers/NewProviderConfiguration.tsx`.
2. Add its type definition to `settingsTypes.ts`.
3. Register it in `providerRegistry` in `ApiConfiguration.tsx`.

### Persistence
Persistence uses the webview VS Code bridge (see `usePersistedSettings`) and stores provider configurations keyed by provider id.

### Validation
Lightweight synchronous validation example is included; recommend adding a shared schema validator (e.g. Zod) if validation grows complex.

### Roadmap
* Secret masking / reveal toggle.
* Form-level validation messages.
* Migrate inline styles to Tailwind utility classes for consistency.
* Encrypt-at-rest (handled extension-side) for sensitive keys.

---
Part of NeoCopilot webview.
