import React, { useCallback } from 'react';
import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../../state/SettingsContext';

const AzureFoundryConfigurationComponent: React.FC = () => {
  const { configs, updateConfig, save, isDirty, saving } = useSettings();
  const cfg = configs.azure;

  type PossibleEvent = Event | React.FormEvent<HTMLElement>;
  const onInput = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) {return;}
    updateConfig('azure', { [target.id]: target.value });
  }, [updateConfig]);

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="baseUrl" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Base URL</label>
  <VSCodeTextField type="text" id="baseUrl" value={cfg.baseUrl} onInput={onInput} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>API Key</label>
  <VSCodeTextField type="password" id="apiKey" value={cfg.apiKey} onInput={onInput} style={{ width: '100%' }} />
        <p style={{ fontSize: '0.8em', color: 'var(--vscode-editor-foreground)', marginTop: '5px' }}>
          Stored locally for API calls only.
        </p>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="modelId" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Model ID</label>
  <VSCodeTextField type="text" id="modelId" value={cfg.modelId} onInput={onInput} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="azureApiVersion" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Azure API Version</label>
  <VSCodeTextField type="text" id="azureApiVersion" value={cfg.azureApiVersion} onInput={onInput} style={{ width: '100%' }} />
      </div>
      <button disabled={!isDirty || saving} onClick={save} style={{ width: '100%' }}>
        {saving ? 'Saving...' : isDirty ? 'Save Settings' : 'Saved'}
      </button>
    </div>
  );
};

export default AzureFoundryConfigurationComponent;