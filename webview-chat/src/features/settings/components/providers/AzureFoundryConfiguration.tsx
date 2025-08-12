import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VSCodeTextField, VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import Field from '../ui/Field';
import { useProviderConfig, useSettingsActions } from '../../state/SettingsSelectors';

const AzureFoundryConfigurationComponent: React.FC = () => {
  const persistedBase = useProviderConfig('azure');
  const persisted = persistedBase as typeof persistedBase & { azureApiVersion: string }; // assert azure shape
  const { updateConfig, save } = useSettingsActions();
  const [working, setWorking] = useState(persisted);

  // Sync working copy if persisted changes externally
  useEffect(() => { setWorking(persisted); }, [persisted]);

  type PossibleEvent = Event | React.FormEvent<HTMLElement>;
  const onInput = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) {return;}
    const id = target.id as keyof typeof working;
    setWorking(prev => ({ ...prev, [id]: target.value }));
  }, []);

  const isDirty = useMemo(() => (
    working.baseUrl !== persisted.baseUrl ||
    working.apiKey !== persisted.apiKey ||
    working.modelId !== persisted.modelId ||
    working.azureApiVersion !== persisted.azureApiVersion
  ), [working, persisted]);

  const onSave = useCallback(() => {
    if (!isDirty) {return;}
    updateConfig('azure', {
      baseUrl: working.baseUrl,
      apiKey: working.apiKey,
      modelId: working.modelId,
      azureApiVersion: working.azureApiVersion,
    });
    save();
  }, [isDirty, updateConfig, working, save]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => { e.preventDefault(); onSave(); }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="baseUrl" label="Base URL" description="Azure OpenAI endpoint root">
          <VSCodeTextField id="baseUrl" value={working.baseUrl} onInput={onInput} placeholder="https://{resource}.openai.azure.com/" />
        </Field>
        <Field id="modelId" label="Deployment / Model ID" description="Azure deployment name (NOT the model family)" required>
          <VSCodeTextField id="modelId" value={working.modelId} onInput={onInput} placeholder="gpt-4o" />
        </Field>
        <Field id="apiKey" label="API Key" description="Stored locally only; never synced." required>
          <VSCodeTextField id="apiKey" type="password" value={working.apiKey} onInput={onInput} placeholder="xxxxxxxx" />
        </Field>
        <Field id="azureApiVersion" label="API Version" description="Version query param for Azure OpenAI">
          <VSCodeTextField id="azureApiVersion" value={working.azureApiVersion} onInput={onInput} placeholder="2024-02-01" />
        </Field>
      </div>
      <div className="flex gap-3">
        <VSCodeButton
          disabled={!isDirty}
          type="submit"
          onClick={onSave}
          className="flex-1"
        >
          {isDirty ? 'Save Settings' : 'Saved'}
        </VSCodeButton>
      </div>
    </form>
  );
};

export default AzureFoundryConfigurationComponent;