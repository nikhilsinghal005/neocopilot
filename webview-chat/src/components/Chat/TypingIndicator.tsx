// src/components/Chat/TypingIndicator.tsx
import { useVscode } from '../../context/VscodeContext';
import React, { useState, useEffect } from 'react';

const TypingIndicator: React.FC = () => {
  // Setting a default value for input
  const [input, setInput] = useState("Processing");
  const vscode = useVscode();

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'chat_response_state_info') {
        setInput(event.data.data.inputState || '');
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
        className="rounded-xs px-1 flex items-center h-6 text-xxxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
        }}
      >
      <span className="mr-1">{input}</span>
        {/* Processing spinner icon */}
        <svg
          className="animate-spin mr-1 h-3 w-3"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: 'var(--vscode-editor-foreground)' }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </span>
    </div>
  );
};

export default TypingIndicator;
