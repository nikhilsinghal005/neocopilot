import React from 'react';
import { useCoworkerContext } from '../../context/CoworkerContext';
import { useVscode } from '../../context/VscodeContext';
import CodeButton from '../Common/CodeButton';

const CoworkerControls: React.FC = () => {
  const vscode = useVscode(); // Consume vscode from context
  const { clearCoworkerSession, setIsTyping, isTyping, setIsEditing } = useCoworkerContext();

  const handleRefreshClick = () => {
    clearCoworkerSession();
    setIsTyping(false);
    setIsEditing(false);
    vscode.postMessage({
      command: 'cleanSmartinsertionPreviousStates',
      data: {},
    });
  };

  const handleToggleClick = () => {
    if (isTyping) {
      alert("Please wait for the message to finish."); // Optionally, show an alert instead of console log
      return;
    }
    
    vscode.postMessage({
      command: 'toggleSidebar',
      data: {},
    });
  };

  return (
    <div className="flex space-x-2 pr-4">
      <CodeButton
        onClick={handleRefreshClick}
        ariaLabel="Refresh"
        icon="codicon-refresh"
        tooltip="New Coworker Session"
      />
      <CodeButton
        onClick={handleToggleClick}
        ariaLabel="Toggle Sidebar"
        icon="codicon-arrow-swap"
        tooltip="Toggle View"
        disabled={isTyping}
      />
    </div>
  );
};

export default CoworkerControls;
