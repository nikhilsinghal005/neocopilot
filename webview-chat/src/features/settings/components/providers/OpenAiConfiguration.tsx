import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useVscode } from '../../../../integration/vscode/api';
import { VSCodeTextField, VSCodeButton, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useSettingsActions } from '../../state/SettingsSelectors';
import Field from '../ui/Field';
import { useProviderConfig } from '../../state/SettingsSelectors';

const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'o1-preview',
  'o1-mini',
  'text-embedding-3-large',
  'text-embedding-3-small'
];

const OpenAiConfigurationComponent: React.FC = () => {
  const vscode = useVscode();
  // Global persisted config snapshot
  const persistedCfg = useProviderConfig('openai');
  const { updateConfig, save } = useSettingsActions();

  // Local working copy (no global dispatch while editing)
  const [workingCfg, setWorkingCfg] = useState(persistedCfg);
  const [customModel, setCustomModel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [hasStoredSecret, setHasStoredSecret] = useState(false); // indicates secret stored in extension secret storage
  const [clearing, setClearing] = useState(false);
  // Separate UI selection state so selecting "Custom" doesn't immediately revert to previous model
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (OPENAI_MODELS.includes(workingCfg.modelId)) {return workingCfg.modelId;}
    if (workingCfg.modelId) {return '__custom';}
    return '';
  });

  // Sync local working copy when persisted config changes (external load/save)
  useEffect(() => {
    setWorkingCfg(persistedCfg);
    if (OPENAI_MODELS.includes(persistedCfg.modelId)) {
      setSelectedModel(persistedCfg.modelId);
      setShowCustomInput(false);
    } else if (persistedCfg.modelId) {
      setSelectedModel('__custom');
    } else {
      setSelectedModel('');
    }
  }, [persistedCfg]);

  // Request secret status from extension when component mounts
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      const msg = e.data;
      if (msg?.command === 'settings:apiKeyStatus') {
        setHasStoredSecret(!!msg.payload?.openai);
      }
    };
    window.addEventListener('message', handleMsg);
    // Ask extension for status
  vscode?.postMessage?.({ command: 'settings:requestApiKeyStatus' });
    return () => window.removeEventListener('message', handleMsg);
  }, [vscode]);

  // Keep selectedModel in sync when working copy changes locally
  useEffect(() => {
    if (OPENAI_MODELS.includes(workingCfg.modelId)) {
      setSelectedModel(workingCfg.modelId);
      setShowCustomInput(false);
    } else if (workingCfg.modelId) {
      setSelectedModel('__custom');
    } else {
      setSelectedModel('');
    }
  }, [workingCfg.modelId]);

  type PossibleEvent = Event | React.FormEvent<HTMLElement>;
  const onInput = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) {return;}
    const id = target.id as keyof typeof workingCfg;
    setWorkingCfg(prev => ({ ...prev, [id]: target.value }));
  }, []);

  const onModelSelect = useCallback((e: PossibleEvent) => {
    const target = e.target as HTMLSelectElement | null;
    if (!target) {return;}
    const value = target.value;
    setSelectedModel(value);
    if (value === '__custom') {
      setShowCustomInput(true);
      return;
    }
    // Debounced update (reduces rerenders of parent context consumers)
    setWorkingCfg(prev => ({ ...prev, modelId: value }));
    setShowCustomInput(false);
  }, []);

  const applyCustomModel = useCallback(() => {
    const trimmed = customModel.trim();
    if (trimmed) {
      setWorkingCfg(prev => ({ ...prev, modelId: trimmed }));
      setCustomModel('');
      setShowCustomInput(false);
      setSelectedModel('__custom');
    }
  }, [customModel]);
  const effectiveModelInList = OPENAI_MODELS.includes(workingCfg.modelId);

  // Derived dirty flag (shallow compare working vs persisted)
  const isDirty = useMemo(() => {
    const baseChanged = workingCfg.baseUrl !== persistedCfg.baseUrl;
    const modelChanged = workingCfg.modelId !== persistedCfg.modelId;
    // Api key dirty if user typed something new OR cleared existing secret
    const apiKeyDirty = !!workingCfg.apiKey || (hasStoredSecret && clearing);
    return baseChanged || modelChanged || apiKeyDirty;
  }, [workingCfg.baseUrl, workingCfg.modelId, workingCfg.apiKey, persistedCfg.baseUrl, persistedCfg.modelId, hasStoredSecret, clearing]);

  const saving = false; // Local form save - global saving not tracked per keystroke now

  const onSave = useCallback(() => {
    if (!isDirty) {return;}
    updateConfig('openai', {
      baseUrl: workingCfg.baseUrl,
      apiKey: workingCfg.apiKey, // will be redacted before localStorage; extension stores secret
      modelId: workingCfg.modelId,
    });
    // Persist global state
    save();
    // After save, clear local apiKey field to avoid keeping it in memory if we just stored it
    if (workingCfg.apiKey) {
      setWorkingCfg(prev => ({ ...prev, apiKey: '' }));
      setHasStoredSecret(true);
    }
    setClearing(false);
  }, [isDirty, updateConfig, workingCfg, save]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => { e.preventDefault(); if (isDirty && !saving) {save();} }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="baseUrl" label="Base URL (optional)" description="Leave blank to use the default https://api.openai.com/v1">
          <VSCodeTextField id="baseUrl" value={workingCfg.baseUrl} onInput={onInput} placeholder="https://api.openai.com/v1" />
        </Field>
        <Field id="modelId" label="Model" description="Select a common model or enter a custom deployment/model name">
          <div className="flex flex-col gap-2">
            <VSCodeDropdown id="modelId-select" value={selectedModel} onChange={onModelSelect} className="w-full">
              <VSCodeOption value="" disabled>Select model</VSCodeOption>
              {OPENAI_MODELS.map(m => <VSCodeOption key={m} value={m}>{m}</VSCodeOption>)}
              <VSCodeOption value="__custom">Custom…</VSCodeOption>
            </VSCodeDropdown>
            {!effectiveModelInList && workingCfg.modelId && (
              <div className="text-[10px] text-[var(--vscode-descriptionForeground)]">Custom model: {workingCfg.modelId}</div>
            )}
            {showCustomInput && selectedModel === '__custom' && (
              <div className="flex gap-2 items-end">
                <input
                  id="customModel"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Enter custom model id"
                  className="flex-1 rounded border border-[var(--vscode-editorWidget-border)] bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]"
                />
                <VSCodeButton type="button" appearance="secondary" disabled={!customModel.trim()} onClick={applyCustomModel}>Apply</VSCodeButton>
              </div>
            )}
          </div>
        </Field>
        <Field id="apiKey" label="API Key" description="Stored securely in VS Code Secret Storage." required>
          <div className="flex gap-2 items-center w-full">
            <VSCodeTextField id="apiKey" type="password" value={workingCfg.apiKey} onInput={onInput} placeholder={hasStoredSecret ? '•••••••• (stored)' : 'sk-...'} className="flex-1" />
            {hasStoredSecret && !workingCfg.apiKey && (
              <VSCodeButton type="button" appearance="secondary" onClick={() => { setClearing(true); setHasStoredSecret(false); }}>
                Clear
              </VSCodeButton>
            )}
          </div>
        </Field>
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--vscode-descriptionForeground)]">
  {workingCfg.apiKey ? <span className="opacity-80">Key length: {workingCfg.apiKey.length}</span> : hasStoredSecret ? <span className="opacity-70">Key stored securely</span> : <span className="opacity-60">No key set</span>}
  {!effectiveModelInList && workingCfg.modelId && <span className="opacity-70">Using custom model id</span>}
      </div>
      <div className="flex gap-3">
        <VSCodeButton
          disabled={!isDirty}
          type="button"
          onClick={onSave}
          className="flex-1"
        >
          {isDirty ? 'Save Settings' : 'Saved'}
        </VSCodeButton>
      </div>
    </form>
  );
};

export default React.memo(OpenAiConfigurationComponent);