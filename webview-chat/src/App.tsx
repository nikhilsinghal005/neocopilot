import React, { useEffect } from 'react';
import Chat from './pages/Chat';
import Tabs from './pages/Tabs';
import { ChatProvider } from './context/ChatContext';
import { CoworkerProvider } from './context/CoworkerContext';
import { VscodeProvider } from './context/VscodeContext';
import About from './pages/About';
import Coworker from './pages/Coworker';

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

  const tabContent = [
    {
      label: 'Chat',
      content: <Chat />,
    },
    {
      label: 'Coworker',
      content: <Coworker />,
    },
    {
      label: 'About',
      content: <About vscode={vscodeApi} />,
    }
  ];

  return (
    <VscodeProvider vscode={vscodeApi}> 
      <ChatProvider>
        <CoworkerProvider>
          <div className="App h-full flex items-center justify-center overflow-hidden">
            <Tabs tabs={tabContent} />
          </div>
          </CoworkerProvider>
      </ChatProvider>
    </VscodeProvider>
  );
};

export default App;
