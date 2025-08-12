import React, { useCallback } from 'react';
import { VSCodeTextField, VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useSettings } from '../../state/SettingsContext';
import Field from '../ui/Field';

const OpenAiConfigurationComponent: React.FC = () => {
  const { configs, updateConfig, save, isDirty, saving } = useSettings();
  const cfg = configs.openai;

  type PossibleEvent = Event | React.FormEvent<HTMLElement>;
  const onInput = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) {return;}
    updateConfig('openai', { [target.id]: target.value });
  }, [updateConfig]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => { e.preventDefault(); if (isDirty && !saving) {save();} }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="baseUrl" label="Base URL" description="Endpoint root for OpenAI-compatible API">
          <VSCodeTextField id="baseUrl" value={cfg.baseUrl} onInput={onInput} placeholder="https://api.openai.com/v1" />
        </Field>
        <Field id="modelId" label="Model ID" description="Primary model used for chat / completion">
          <VSCodeTextField id="modelId" value={cfg.modelId} onInput={onInput} placeholder="gpt-4o" />
        </Field>
        <Field id="apiKey" label="API Key" description="Stored locally only; never synced." required>
          <VSCodeTextField id="apiKey" type="password" value={cfg.apiKey} onInput={onInput} placeholder="sk-..." />
        </Field>
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--vscode-descriptionForeground)]">
        {cfg.apiKey ? <span className="opacity-80">Key length: {cfg.apiKey.length}</span> : <span className="opacity-60">No key set</span>}
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

export default OpenAiConfigurationComponent;