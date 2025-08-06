import React, { useState } from 'react';
import OpenAiConfiguration from './providers/OpenAiConfiguration';
import AzureFoundryConfiguration from './providers/AzureFoundryConfiguration';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';

type ApiProviderType = 'openai' | 'azure';

const ApiConfiguration: React.FC = () => {
  const [apiProvider, setApiProvider] = useState<ApiProviderType>('openai');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDropdownChange = (e: any) => {
    setApiProvider(e.target.value as ApiProviderType);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="api-provider-select" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em' }}>API Provider</label>
        <VSCodeDropdown
          id="api-provider-select"
          value={apiProvider}
          onChange={handleDropdownChange}
          style={{
            width: '100%',
          }}
        >
          <VSCodeOption value="openai">OpenAI</VSCodeOption>
          <VSCodeOption value="azure">Azure Foundry</VSCodeOption>
        </VSCodeDropdown>
      </div>

      {apiProvider === 'openai' && <OpenAiConfiguration />}
      {apiProvider === 'azure' && <AzureFoundryConfiguration />}

    </div>
  );
};

export default ApiConfiguration;