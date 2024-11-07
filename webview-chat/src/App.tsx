import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Tabs from './pages/Tabs';
import { ChatProvider } from './context/ChatContext';
import { VscodeProvider } from './context/VscodeContext';
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
    // console.log('Session data:', value, expiry, 'Current time:', Date.now());
    return value && Date.now() < expiry;
  }
  // console.log('No valid session data found.');
  return false;
};

const setSessionData = (value: boolean) => {
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
  const sessionData = JSON.stringify({ value, expiry });
  sessionStorage.setItem('isLoggedIn', sessionData);
  // console.log('Session data set with expiry:', expiry);
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isSessionValid());

  // Function to check if session is expired and re-validate
  const checkSessionAndRevalidate = () => {
    const sessionIsValid = isSessionValid();
    // console.log('Checking session validity:', sessionIsValid);
    if (!sessionIsValid) {
      // console.log("Session expired or invalid, sending 'ready' command to revalidate login status.");
      vscodeApi.postMessage({ command: 'ready' });
    }
  };

  useEffect(() => {
    // console.log('Sending initial "ready" command.');
    vscodeApi.postMessage({ command: 'ready' });

    const handleMessage = (event: MessageEvent) => {
      // console.log('Message received from VSCode:', event.data);
      const message = event.data;
      if (message.command === 'authStatus') {
        // console.log('Received authStatus:', message.isLoggedIn);
        setIsLoggedIn(message.isLoggedIn);

        if (message.isLoggedIn) {
          setSessionData(message.isLoggedIn);
        } else {
          // Clear session data if logged out
          sessionStorage.removeItem('isLoggedIn');
          // console.log('Session cleared.');
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Set an interval to check the session status periodically
    const sessionCheckInterval = setInterval(() => {
      checkSessionAndRevalidate();
    }, 60 * 60 * 1000); // Check every 1 minute for testing

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(sessionCheckInterval); // Clear the interval when component unmounts
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
          {isLoggedIn ? (
            <Tabs tabs={tabContent} />
          ) : (
            <Login vscode={vscodeApi} />
          )}
        </div>
      </ChatProvider>
    </VscodeProvider>
  );
};

export default App;
