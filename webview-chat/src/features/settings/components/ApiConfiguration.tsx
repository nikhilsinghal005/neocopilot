import React, { useCallback } from 'react';
import OpenAiConfiguration from './providers/OpenAiConfiguration';
import AzureFoundryConfiguration from './providers/AzureFoundryConfiguration';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
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
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="api-provider-select" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>API Provider</label>
  <VSCodeDropdown id="api-provider-select" value={activeProvider} onChange={onChange} style={{ width: '100%' }}>
          {Object.entries(providerRegistry).map(([id, meta]) => (
            <VSCodeOption key={id} value={id}>{meta.label}</VSCodeOption>
          ))}
        </VSCodeDropdown>
      </div>
      <ActiveComponent />
    </div>
  );
};

export default ApiConfigurationComponent;