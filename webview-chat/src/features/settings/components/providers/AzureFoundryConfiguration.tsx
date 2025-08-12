import React, { useCallback } from 'react';
import { VSCodeTextField, VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../../state/SettingsContext';
import Field from '../ui/Field';

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
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => { e.preventDefault(); if (isDirty && !saving) {save();} }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="baseUrl" label="Base URL" description="Azure OpenAI endpoint root">
          <VSCodeTextField id="baseUrl" value={cfg.baseUrl} onInput={onInput} placeholder="https://{resource}.openai.azure.com/" />
        </Field>
        <Field id="modelId" label="Deployment / Model ID" description="Azure deployment name (NOT the model family)" required>
          <VSCodeTextField id="modelId" value={cfg.modelId} onInput={onInput} placeholder="gpt-4o" />
        </Field>
        <Field id="apiKey" label="API Key" description="Stored locally only; never synced." required>
          <VSCodeTextField id="apiKey" type="password" value={cfg.apiKey} onInput={onInput} placeholder="xxxxxxxx" />
        </Field>
        <Field id="azureApiVersion" label="API Version" description="Version query param for Azure OpenAI">
          <VSCodeTextField id="azureApiVersion" value={cfg.azureApiVersion} onInput={onInput} placeholder="2024-02-01" />
        </Field>
      </div>
      <div className="flex gap-3">
        <VSCodeButton
          disabled={!isDirty || saving}
          type="submit"
          className="flex-1"
        >
          {saving ? 'Saving…' : isDirty ? 'Save Settings' : 'Saved'}
        </VSCodeButton>
      </div>
    </form>
  );
};

export default AzureFoundryConfigurationComponent;