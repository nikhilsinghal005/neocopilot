import React from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import { useVscode } from '../../../integration/vscode/api';
import CodeButton from '../../../shared/components/common/CodeButton';

const ChatControls: React.FC = () => {
  const vscode = useVscode(); // Consume vscode from context
  const { clearChatSession, setIsTyping, isTyping, setIsEditing, } = useChatContext();

  const handleRefreshClick = () => {
    clearChatSession();
    setIsTyping(false);
    setIsEditing(false);
    vscode.postMessage({
      command: 'cleanSmartinsertionPreviousStates',
      data: {},
    });
  };

  const handleToggleClick = () => {
    if (isTyping) {
      // console.log("Please wait for the message to finish.");
      alert("Please wait for the message to finish."); // Optionally, show an alert instead of console log
      return;
    }
    
    // console.log("VS Code API in ChatControls:", vscode);
    vscode.postMessage({
      command: 'toggleSidebar',
      data: {},
    });
  };

  return (
    <div className="flex space-x-2 pr-4">
      {/* <VSCodeButton
        onClick={handleRefreshClick}
        appearance="icon"
        aria-label="Refresh Chat"
      >
        <span className="codicon codicon-refresh"></span>
      </VSCodeButton> */}
      <CodeButton
        onClick={handleRefreshClick}
        ariaLabel="Refresh"
        icon="codicon-refresh"
        tooltip="New Chat"
      />
      <CodeButton
        onClick={handleToggleClick}
        ariaLabel="Toggle Sidebar"
        icon="codicon-arrow-swap"
        tooltip="Toggle View"
        disabled={isTyping}
      />
      {/* <VSCodeButton
        onClick={handleToggleClick}
        appearance="icon"
        aria-label="Toggle Sidebar"
        disabled={isTyping} // Disable the button when typing
      >
        <span className="codicon codicon-arrow-swap"></span>
      </VSCodeButton> */}
    </div>
  );
};

export default ChatControls;
