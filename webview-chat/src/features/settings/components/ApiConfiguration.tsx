import React, { useCallback } from 'react';
import OpenAiConfiguration from './providers/OpenAiConfiguration';
import AzureFoundryConfiguration from './providers/AzureFoundryConfiguration';
import { VSCodeDropdown, VSCodeOption, VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../state/SettingsContext';
import { ProviderId } from '../state/settingsTypes';

const providerRegistry: Record<ProviderId, { label: string; component: React.FC }> = {
  openai: { label: 'OpenAI', component: OpenAiConfiguration },
  azure: { label: 'Azure Foundry', component: AzureFoundryConfiguration },
};

const ApiConfigurationComponent: React.FC = () => {
  const { activeProvider, setActiveProvider } = useSettings();
  const ActiveComponent = providerRegistry[activeProvider].component;

  type PossibleEvent = Event | React.FormEvent<HTMLElement>;
  const onChange = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLSelectElement | null;
    if (target && target.value !== activeProvider) {setActiveProvider(target.value as ProviderId);}
  }, [activeProvider, setActiveProvider]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(providerRegistry).map(([id, meta]) => {
            const isActive = id === activeProvider;
            return (
              <VSCodeButton
                key={id}
                appearance={isActive ? 'primary' : 'secondary'}
                onClick={() => setActiveProvider(id as ProviderId)}
              >
                {meta.label}
              </VSCodeButton>
            );
          })}
        </div>
        <div className="text-[10px] text-[var(--vscode-descriptionForeground)]">
          Switching providers does not erase unsaved changes. Save per provider.
        </div>
        <div className="md:hidden">
          <label htmlFor="api-provider-select" className="text-[10px] font-semibold uppercase tracking-wide text-[var(--vscode-descriptionForeground)]">Provider (mobile)</label>
          <VSCodeDropdown id="api-provider-select" value={activeProvider} onChange={onChange} className="w-full">
            {Object.entries(providerRegistry).map(([id, meta]) => (
              <VSCodeOption key={id} value={id}>{meta.label}</VSCodeOption>
            ))}
          </VSCodeDropdown>
        </div>
      </div>
      <div className="rounded-md border border-[var(--vscode-editorWidget-border)] p-4 bg-[var(--vscode-editorWidget-background)] shadow-sm">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default ApiConfigurationComponent;