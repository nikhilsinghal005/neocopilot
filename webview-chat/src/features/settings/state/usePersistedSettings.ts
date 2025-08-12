import { useCallback } from 'react';
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
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Conform to VS Code message contract requiring a 'command' field
      vscode?.postMessage?.({ command: 'settings:update', payload: state });
    } catch {
      // Silent failure; consider telemetry instrumentation later
    }
  }, [vscode]);

  return { load, persist };
};
