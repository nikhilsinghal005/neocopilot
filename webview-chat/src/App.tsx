import React from 'react';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { ChatProvider, useChatContext } from './features/chat/state/ChatContext';
import { VscodeProvider } from './integration/vscode/VscodeContext';
import { VscodeApi } from './integration/vscode/api';
import { SettingsProvider } from './features/settings';

// Declare the function that acquires the API.
declare const acquireVsCodeApi: () => VscodeApi;

// Get the VS Code API instance. It's a singleton, so it should be called only once.
const vscodeApi = acquireVsCodeApi();

const AppContent: React.FC = () => {
  const { currentView } = useChatContext();

  return (
    <div className="App h-full flex items-center justify-center overflow-hidden">
      {currentView === 'chat' && <Chat />}
      {currentView === 'settings' && <Settings />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <VscodeProvider vscode={vscodeApi}>
      <SettingsProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </SettingsProvider>
    </VscodeProvider>
  );
};

export default App;
