import React, { useState } from 'react';
import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

const initialApiConfig: ApiConfig = {
    baseUrl: '',
    apiKey: '',
    modelId: '',
  };

const OpenAiConfiguration: React.FC = () => {
    const [apiConfig, setApiConfig] = useState(initialApiConfig);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInputChange = (e: any) => {
        const { id, value } = e.target;
        setApiConfig(prevConfig => ({
          ...prevConfig,
          [id]: value,
        }));
      };

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="baseUrl" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Base URL</label>
        <VSCodeTextField
          type="text"
          id="baseUrl"
          value={apiConfig.baseUrl}
          onInput={handleInputChange}
          style={{
            width: '100%',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="apiKey" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>API Key</label>
        <VSCodeTextField
          type="password"
          id="apiKey"
          value={apiConfig.apiKey}
          onInput={handleInputChange}
          style={{
            width: '100%',
          }}
        />
        <p style={{ fontSize: '0.8em', color: 'var(--vscode-editor-foreground)', marginTop: '5px' }}>
          This key is stored locally and only used to make API requests from this extension.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="modelId" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>Model ID</label>
        <VSCodeTextField
          type="text"
          id="modelId"
          value={apiConfig.modelId}
          onInput={handleInputChange}
          style={{
            width: '100%',
          }}
        />
      </div>
    </div>
  );
};

export default OpenAiConfiguration;