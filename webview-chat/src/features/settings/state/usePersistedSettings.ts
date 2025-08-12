import { useCallback, useMemo } from 'react';
import { SettingsState } from './settingsTypes';
import { useVscode } from '../../../integration/vscode/api';

const STORAGE_KEY = 'neoCopilot.settings';

export const usePersistedSettings = () => {
  const vscode = useVscode();

  const load = useCallback((): SettingsState | null => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {return null;}
      return JSON.parse(raw) as SettingsState;
    } catch {
      return null;
    }
  }, []);

  const persist = useCallback((state: SettingsState) => {
    try {
      // Redact apiKeys before writing to localStorage
      const redacted: SettingsState = {
        ...state,
        configs: {
          ...state.configs,
          openai: { ...state.configs.openai, apiKey: '' },
          azure: { ...state.configs.azure, apiKey: '' },
        }
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(redacted));
      // Send full (unredacted) state to extension so it can store secrets securely
      vscode?.postMessage?.({ command: 'settings:update', payload: state });
    } catch {
      // Silent failure; consider telemetry instrumentation later
    }
  }, [vscode]);

  return useMemo(() => ({ load, persist }), [load, persist]);
};
