// src/components/chat/NewChatPanel.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';

const NewChatPanel: React.FC = () => {
  const markdownContent = `
# Welcome to Neo Copilot

Start a new conversation by typing your message below, or click refresh to start a new session. For your privacy, no messages are saved or stored.

Neo Copilot is here to help you write better code, faster.
`;

  return (
    <div 
      className="w-full h-full flex flex-col justify-start items-center"
      style={{ 
        paddingTop: '40px'
      }}
    >
      <div className="card border rounded-xs shadow-xl p-6 overflow-hidden h-[300px]"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
          maxWidth: '450x', // Set a maximum width of 500 pixels
          minWidth: '350px', // Set a maximum width of 500 pixels
          width: '100%', // Ensures responsiveness
        }}
      >
        <ReactMarkdown 
          children={markdownContent} 
          components={{
            h1: ({node, ...props}) => <div className="text-2xl font-bold mb-6" {...props} style={{ color: 'var(--vscode-editor-foreground)' }} />,
            p: ({node, ...props}) => <p className="text-base mb-4" {...props} style={{ color: 'var(--vscode-editor-foreground)' }} />
          }}
        />
      </div>
    </div>
  );
};

export default NewChatPanel;
