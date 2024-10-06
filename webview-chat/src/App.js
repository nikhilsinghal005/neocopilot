import { jsx as _jsx } from "react/jsx-runtime";
// webview-chat/src/App.tsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
const vscodeApi = acquireVsCodeApi(); // Acquire once at the top level
const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
        // Send 'ready' message to the extension
        vscodeApi.postMessage({ command: 'ready' });
        console.log('React app sent: ready');
        // Listen for messages from the VS Code extension
        const handleMessage = (event) => {
            const message = event.data;
            console.log('React app received message:', message);
            if (message.command === 'authStatus') {
                console.log("Nikhil");
                setIsLoggedIn(message.isLoggedIn);
            }
        };
        window.addEventListener('message', handleMessage);
        // Clean up the event listener
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);
    return (_jsx("div", { className: "App h-full flex items-center justify-center overflow-hidden", children: isLoggedIn ? _jsx(Chat, { vscode: vscodeApi }) : _jsx(Login, { vscode: vscodeApi }) }));
};
export default App;
