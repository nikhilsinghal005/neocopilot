// src/components/Chat/TypingIndicator.tsx
import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="message flex justify-start mb-3">
      <span className="codicon codicon-person text-vscode-editor-foreground mr-2"></span>
      <div className="p-3 rounded-lg max-w-full break-words shadow-md text-vscode-editor-foreground"
        style={{
          backgroundColor: 'var(--vscode-editor-background)'
        }}
      >
        <span className="block text-xs font-semibold mb-1 opacity-75">
          NEO ·{' '}
          {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className="flex space-x-2">
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-200"></span>
          <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-400"></span>
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;
