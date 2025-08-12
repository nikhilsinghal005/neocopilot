import { useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { ProviderId } from './settingsTypes';
import { SettingsContextValue } from './useSettingsLogic';

// Selective hooks to prevent unnecessary rerenders
export const useSettingsActions = () => {
  const { save, updateConfig, setActiveProvider, setActiveProviderUiOnly } = useSettings() as SettingsContextValue;
  return useMemo(() => ({ save, updateConfig, setActiveProvider, setActiveProviderUiOnly }), [save, updateConfig, setActiveProvider, setActiveProviderUiOnly]);
};

export const useSettingsStatus = () => {
  const { isDirty, saving, lastSavedAt } = useSettings();
  return useMemo(() => ({ isDirty, saving, lastSavedAt }), [isDirty, saving, lastSavedAt]);
};

export const useActiveProvider = () => {
  const { activeProvider } = useSettings();
  return activeProvider;
};

export const useProviderConfig = (providerId: ProviderId) => {
  const { configs } = useSettings();
  return useMemo(() => configs[providerId], [configs, providerId]);
};

export const useCurrentProviderConfig = () => {
  const { activeProvider, configs } = useSettings();
  return useMemo(() => configs[activeProvider], [configs, activeProvider]);
};
