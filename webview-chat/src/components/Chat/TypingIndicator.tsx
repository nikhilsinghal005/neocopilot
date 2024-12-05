// src/components/Chat/TypingIndicator.tsx
import { useVscode } from '../../context/VscodeContext';
import React, { useState, useEffect, useCallback } from 'react';

const TypingIndicator: React.FC = () => {
  // Setting a default value for input
  const [input, setInput] = useState("processing");
  const vscode = useVscode();

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'chat_response_state_info') {
        console.log('Received chat message from VS Code:', event.data);
        setInput(event.data.inputState || ''); // Update input with incoming data or fallback to empty string
      }
    };

    window.addEventListener('message', handleIncomingMessage);

    return () => {
      window.removeEventListener('message', handleIncomingMessage);
    };
  }, [input, setInput]);

  return (
    <div className="message flex justify-start mb-4">
      <span className="codicon codicon-person text-vscode-editor-foreground mr-1"></span>
      <div
        className="p-3 rounded-lg max-w-full break-words shadow-md text-vscode-editor-foreground"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
        }}
      >
        <div className="flex items-center space-x-2">
          <span>{input}</span>
          <div className="flex space-x-1">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
            <span
              className="w-2 h-2 rounded-full animate-pulse delay-[200ms]"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
            <span
              className="w-2 h-2 rounded-full animate-pulse delay-[400ms]"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
