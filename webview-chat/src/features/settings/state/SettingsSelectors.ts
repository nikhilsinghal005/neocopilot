import { useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { ProviderId } from './settingsTypes';

// Selective hooks to prevent unnecessary rerenders
export const useSettingsActions = () => {
  const { save, updateConfig, setActiveProvider } = useSettings();
  return useMemo(() => ({ save, updateConfig, setActiveProvider }), [save, updateConfig, setActiveProvider]);
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
