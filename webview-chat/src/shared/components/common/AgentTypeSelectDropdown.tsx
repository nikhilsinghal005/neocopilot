import React from 'react';
import { MessageStore } from '../../types/Message';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';

interface AgentTypeSelectDropdownProps {
  message: MessageStore;
  handleRefresh: (messageId: string, agentType: string) => void;
}

const AgentTypeSelectDropdown: React.FC<AgentTypeSelectDropdownProps> = ({
  message,
  handleRefresh,
}) => {
  const agentTypes = ['ask', 'agent'];

  return (
    <>
      <style>
        {`
          vscode-dropdown {
            position: relative;
          }
          vscode-dropdown::part(listbox) {
            position: absolute;
            bottom: 100%; /* Position options above the dropdown */
            top: auto !important; /* Override default positioning */
            transform: translateY(0); /* Ensure proper positioning */
          }
          vscode-dropdown::part(control) {
            font-size: 11px;
            border: none;
          }
          vscode-option::part(control) {  
            font-size: 11px;
            border: none;
          }
        `}
      </style>
      <VSCodeDropdown
        className="rounded-xs h-5"
        style={{
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground)';
          e.currentTarget.style.color = 'var(--vscode-button-foreground)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
        }}
        value={message.modelSelected}
        onChange={(e) => {
          handleRefresh(message.id, (e.target as HTMLSelectElement).value);
        }}
      >
        {agentTypes.map((type) => (
          <VSCodeOption
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
            }}
            key={type}
            value={type}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
    </>
  );
};

export default AgentTypeSelectDropdown;