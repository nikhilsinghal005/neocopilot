import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Tabs from "./pages/Tabs";
import { ChatProvider } from "./context/ChatContext";
import { CoworkerProvider } from "./context/CoworkerContext";
import { VscodeProvider } from "./context/VscodeContext";
import About from "./pages/About";
import Coworker from "./pages/Coworker";

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
  const sessionData = sessionStorage.getItem("isLoggedIn");
  if (sessionData) {
    const { value, expiry } = JSON.parse(sessionData);
    return value && Date.now() < expiry;
  }
  return false;
};

const setSessionData = (value: boolean) => {
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
  const sessionData = JSON.stringify({ value, expiry });
  sessionStorage.setItem("isLoggedIn", sessionData);
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(isSessionValid());

  useEffect(() => {
    vscodeApi.postMessage({ command: "ready" });

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "authStatus") {
        setIsLoggedIn(message.isLoggedIn);
        if (message.isLoggedIn) {
          setSessionData(message.isLoggedIn);
        } else {
          sessionStorage.removeItem("isLoggedIn");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    const sessionCheckInterval = setInterval(() => {
      if (!isSessionValid()) {
        vscodeApi.postMessage({ command: "ready" });
      }
    }, 60 * 1000); // Check every 1 minute

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const tabContent = [
    { label: "Chat", content: <Chat /> },
    { label: "Coworker", content: <Coworker /> },
    { label: "About", content: <About vscode={vscodeApi} /> },
  ];

  return (
    <VscodeProvider vscode={vscodeApi}>
      <CoworkerProvider>
        <ChatProvider>
          <div className="App h-full flex items-center justify-center overflow-hidden">
            {isLoggedIn ? (
              <Tabs tabs={tabContent} />
            ) : (
              <Login vscode={vscodeApi} />
            )}
          </div>
        </ChatProvider>
      </CoworkerProvider>
    </VscodeProvider>
  );
};

export default App;
