//src/components/chat/NewChatPanel.tsx
import React from 'react';

const NewChatPanel: React.FC = () => {
  return (
    <div className="new-chat-panel w-full h-full flex flex-col justify-start items-center bg-vscode-editor-background text-vscode-editor-foreground pt-12">
      <div className="w-4/5 bg-vscode-editor-background border border-vscode-editorGroup-border p-6 rounded-lg shadow-md">
        <div className="text-2xl font-semibold text-vscode-editor-foreground mb-4">Welcome to the Chat!</div>
        <p className="text-vscode-editor-foreground mb-3">
          Start a conversation by typing your message below, or click refresh to begin a new session.
        </p>
        <p className="text-vscode-input-placeholder">Your conversation will appear here once you send a message.</p>
      </div>
    </div>
  );
};

export default NewChatPanel;
