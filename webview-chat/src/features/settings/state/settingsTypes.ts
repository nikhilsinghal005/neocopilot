export type ProviderId = 'openai' | 'azure';

export interface BaseProviderConfig {
  baseUrl: string;
  apiKey: string; // Stored locally (extension storage); not sent to remote except when invoking API
  modelId: string;
}

export type OpenAIProviderConfig = BaseProviderConfig; // alias (was empty interface)

export interface AzureProviderConfig extends BaseProviderConfig {
  azureApiVersion: string;
}

export type ProviderConfigMap = {
  openai: OpenAIProviderConfig;
  azure: AzureProviderConfig;
};

export interface SettingsState {
  activeProvider: ProviderId;
  configs: ProviderConfigMap;
  isDirty: boolean;
  saving: boolean;
  lastSavedAt?: string;
}

export const defaultSettingsState: SettingsState = {
  activeProvider: 'openai',
  configs: {
    openai: { baseUrl: '', apiKey: '', modelId: '' },
    azure: { baseUrl: '', apiKey: '', modelId: '', azureApiVersion: '' },
  },
  isDirty: false,
  saving: false,
};

export type SettingsAction =
  | { type: 'SET_ACTIVE_PROVIDER'; provider: ProviderId }
  | { type: 'SET_ACTIVE_PROVIDER_UI'; provider: ProviderId }
  | { type: 'UPDATE_CONFIG'; provider: ProviderId; patch: Partial<OpenAIProviderConfig> | Partial<AzureProviderConfig> }
  | { type: 'MARK_SAVED' }
  | { type: 'START_SAVING' }
  | { type: 'LOAD_STATE'; state: SettingsState };

export const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case 'SET_ACTIVE_PROVIDER':
      return { ...state, activeProvider: action.provider, isDirty: true };
    case 'SET_ACTIVE_PROVIDER_UI':
      // UI-only switch, do not mark dirty
      if (state.activeProvider === action.provider) { return state; }
      return { ...state, activeProvider: action.provider };
    case 'UPDATE_CONFIG':
      {
        const current = state.configs[action.provider];
        const patch = action.patch as Record<string, unknown>;
        // Detect real changes
        let changed = false;
        const currentRecord = current as unknown as Record<string, unknown>;
        for (const [k, v] of Object.entries(patch)) {
          if (currentRecord[k] !== v) { changed = true; break; }
        }
        if (!changed) {return state;}
        const nextProviderConfig = { ...current, ...patch } as typeof current;
        return {
          ...state,
          configs: {
            ...state.configs,
            [action.provider]: nextProviderConfig,
          },
          isDirty: true,
        };
      }
    case 'START_SAVING':
      return { ...state, saving: true };
    case 'MARK_SAVED':
      return { ...state, isDirty: false, saving: false, lastSavedAt: new Date().toISOString() };
    case 'LOAD_STATE':
      return { ...action.state, isDirty: false, saving: false };
    default:
      return state;
  }
};
