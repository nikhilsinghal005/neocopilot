// src/components/Chat/TypingIndicator.tsx
import { useVscode } from '../../context/VscodeContext';
import React, { useState, useEffect} from 'react';

const TypingIndicator: React.FC = () => {
  // Setting a default value for input
  const [input, setInput] = useState("Processing");
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
    <div className="message flex justify-start mb-4 ml-3">
      <span
        className="rounded-xs px-1 flex items-center h-6 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
        }}
      >
          <span className="mr-1">{input}</span>
          <div className="flex space-x-1">
            <span
              className="w-1 h-1 rounded-full animate-pulse"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
            <span
              className="w-1 h-1 rounded-full animate-pulse delay-[200ms]"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
            <span
              className="w-1 h-1 rounded-full animate-pulse delay-[400ms]"
              style={{
                backgroundColor: 'var(--vscode-editor-foreground)',
              }}
            ></span>
          </div>
      </span>
    </div>
  );
};

export default TypingIndicator;
