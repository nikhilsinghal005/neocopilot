import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Tabs from './pages/Tabs';
import { ChatProvider } from './context/ChatContext';
import { VscodeProvider } from './context/VscodeContext'; // Import the VscodeProvider
import About from './pages/About';

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

const isSessionValid = () => {
  const sessionData = sessionStorage.getItem('isLoggedIn');
  if (sessionData) {
    const { value, expiry } = JSON.parse(sessionData);
    return value && Date.now() < expiry;
  }
  return false;
};

const setSessionData = (value: boolean) => {
  const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const sessionData = JSON.stringify({ value, expiry });
  sessionStorage.setItem('isLoggedIn', sessionData);
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isSessionValid());

  useEffect(() => {
    vscodeApi.postMessage({ command: 'ready' });
    console.log('React app sent: ready');

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'authStatus') {
        setIsLoggedIn(message.isLoggedIn);

        if (message.isLoggedIn) {
          setSessionData(message.isLoggedIn);
        }
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
      content: <Chat />,
    },
    {
      label: 'About',
      content: <About />,
    },
  ];

  return (
    <VscodeProvider vscode={vscodeApi}>
      <ChatProvider>
        <div className="App h-full flex items-center justify-center overflow-hidden">
          {isLoggedIn ? <Tabs tabs={tabContent} /> : <Login vscode={vscodeApi} />}
        </div>
      </ChatProvider>
    </VscodeProvider>
  );
};

export default App;
