import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';

const ChatControls: React.FC = () => {
  const { clearMessages } = useChatContext();

  return (
    <div className="flex space-x-2 pr-4">
      <VSCodeButton
        onClick={clearMessages}
        appearance="icon"
        aria-label="Refresh Chat"
      >
        <span className="codicon codicon-refresh"></span>
      </VSCodeButton>
      {/* You can add more buttons here in the future */}
    </div>
  );
};

export default ChatControls;
