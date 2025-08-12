import React, { useReducer, useCallback } from 'react';
import { defaultSettingsState, settingsReducer, SettingsState, ProviderId } from './settingsTypes';
import { usePersistedSettings } from './usePersistedSettings';

export interface SettingsContextValue extends SettingsState {
  setActiveProvider: (p: ProviderId) => void;
  updateConfig: (p: ProviderId, patch: Record<string, unknown>) => void;
  save: () => void;
}

export const useSettingsLogic = (): SettingsContextValue => {
  const [state, dispatch] = useReducer(settingsReducer, defaultSettingsState);
  const { load, persist } = usePersistedSettings();

  React.useEffect(() => {
    const loaded = load();
    if (loaded) {
      dispatch({ type: 'LOAD_STATE', state: loaded });
    }
  }, [load]);

  const setActiveProvider = useCallback((p: ProviderId) => dispatch({ type: 'SET_ACTIVE_PROVIDER', provider: p }), []);
  const updateConfig = useCallback((p: ProviderId, patch: Record<string, unknown>) => dispatch({ type: 'UPDATE_CONFIG', provider: p, patch }), []);

  const save = useCallback(() => {
    dispatch({ type: 'START_SAVING' });
    persist(state);
    dispatch({ type: 'MARK_SAVED' });
  }, [state, persist]);

  return { ...state, setActiveProvider, updateConfig, save };
};
