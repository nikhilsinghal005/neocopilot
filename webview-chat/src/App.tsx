import React, { useEffect } from 'react';
import Chat from './pages/Chat';
import { ChatProvider } from './context/ChatContext';
import { VscodeProvider } from './context/VscodeContext';

declare const acquireVsCodeApi: () => {
  postMessage: (msg: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscodeApi = acquireVsCodeApi() as {
  postMessage: (msg: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const App: React.FC = () => {
  useEffect(() => {
    vscodeApi.postMessage({ command: 'ready' });
    console.log('App mounted.');
  }, []);

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

export default App;
