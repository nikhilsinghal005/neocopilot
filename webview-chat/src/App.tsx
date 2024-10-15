import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Tabs from './pages/Tabs';
import { ChatProvider } from './context/ChatContext';
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

// Utility function to check session expiration
const isSessionValid = () => {
  const sessionData = sessionStorage.getItem('isLoggedIn');
  if (sessionData) {
    const { value, expiry } = JSON.parse(sessionData);
    return value && Date.now() < expiry;
  }
  return false;
};

// Utility function to set session data with expiry time (8 hours)
const setSessionData = (value: boolean) => {
  const expiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const sessionData = JSON.stringify({ value, expiry });
  sessionStorage.setItem('isLoggedIn', sessionData);
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isSessionValid());

  useEffect(() => {
    // Notify VS Code extension that the app is ready
    vscodeApi.postMessage({ command: 'ready' });
    console.log('React app sent: ready');

    // Handle messages from VS Code extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'authStatus') {
        setIsLoggedIn(message.isLoggedIn);

        // Store login status in session storage with expiry of 8 hours
        if (message.isLoggedIn) {
          setSessionData(message.isLoggedIn);
        }
      }
    };

    // Listen for messages from the VS Code extension
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
      label: 'About',
      content: <About />,
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
