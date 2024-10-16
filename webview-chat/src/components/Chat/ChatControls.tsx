import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';

const ChatControls: React.FC = () => {
  const { clearMessages, setIsTyping } = useChatContext();

  const handleRefreshClick = () => {
    clearMessages();
    setIsTyping(false);
  };

  return (
    <div className="flex space-x-2 pr-4">
      <VSCodeButton
        onClick={handleRefreshClick}
        appearance="icon"
        aria-label="Refresh Chat"
      >
        <span className="codicon codicon-refresh"></span>
      </VSCodeButton>
    </div>
  );
};

export default ChatControls;
