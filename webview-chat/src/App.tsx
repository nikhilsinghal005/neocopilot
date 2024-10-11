// src/App.tsx
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Tabs from './pages/Tabs';
import { ChatProvider } from './context/ChatContext';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    vscodeApi.postMessage({ command: 'ready' });
    console.log('React app sent: ready');

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'authStatus') {
        setIsLoggedIn(message.isLoggedIn);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const tabContent = [
    {
      label: 'Chat',
      content: <Chat vscode={vscodeApi} />,
    },
    {
      label: 'Settings',
      content: <div>Settings Content</div>,
    },
    // You can add more tabs here
  ];

  return (
    <ChatProvider>
      <div className="App h-full flex items-center justify-center overflow-hidden">
        {isLoggedIn ? <Tabs tabs={tabContent} /> : <Login vscode={vscodeApi} />}
      </div>
    </ChatProvider>

  );
};

export default App;
