import React from 'react';
import Chat from './pages/Chat';
import { ChatProvider } from './features/chat/state/ChatContext';
import { VscodeProvider } from './integration/vscode/VscodeContext';
import { VscodeApi } from './integration/vscode/api';

// Declare the function that acquires the API.
declare const acquireVsCodeApi: () => VscodeApi;

// Get the VS Code API instance. It's a singleton, so it should be called only once.
const vscodeApi = acquireVsCodeApi();

const app: React.FC = () => {
  return (
    <VscodeProvider vscode={vscodeApi}>
      <ChatProvider>
        <div className="App h-full flex items-center justify-center overflow-hidden">
          <Chat />
        </div>
      </ChatProvider>
    </VscodeProvider>
  );
};

export default app;
