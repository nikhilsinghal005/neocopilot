// ChatModelDropdown.tsx
import React from 'react';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';

const ChatModelDropdown: React.FC = () => {
  const { chatModel, setChatModel } = useChatContext();

  return (
    <VSCodeDropdown
      className="rounded-md p-0 outline-none text-sm"
      style={{
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
        borderColor: 'var(--vscode-editorGroup-border)',
      }}
      value={chatModel}
      onChange={(e) => {
        if (e.target) {
          setChatModel((e.target as HTMLSelectElement).value);
        }
      }}
    >
      <VSCodeOption value="neo-1">Neo-Basic</VSCodeOption>
      <VSCodeOption value="neo-7">Neo-Expert</VSCodeOption>
    </VSCodeDropdown>
  );
};

export default ChatModelDropdown;
