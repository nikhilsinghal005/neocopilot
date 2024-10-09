// src/App.tsx

import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';

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
    // Send 'ready' message to the extension
    vscodeApi.postMessage({ command: 'ready' });
    console.log('React app sent: ready');

    // Listen for messages from the VS Code extension
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'authStatus') {
        setIsLoggedIn(message.isLoggedIn);
      }
    };

    window.addEventListener('message', handleMessage);

    // Clean up the event listener
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div className="App h-full flex items-center justify-center overflow-hidden">
      {isLoggedIn ? <Chat vscode={vscodeApi} /> : <Login vscode={vscodeApi} />}
    </div>
  );
};

export default App;
