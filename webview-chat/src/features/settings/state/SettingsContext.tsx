import React, { createContext, useContext } from 'react';
import { useSettingsLogic, SettingsContextValue } from './useSettingsLogic';

const settingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useSettingsLogic();
  return <settingsContext.Provider value={value}>{children}</settingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(settingsContext);
  if (!ctx) {throw new Error('useSettings must be used within SettingsProviderComponent');}
  return ctx;
};
