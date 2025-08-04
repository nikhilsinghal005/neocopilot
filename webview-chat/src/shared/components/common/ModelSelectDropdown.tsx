import React from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import { MessageStore } from '../../types/Message';
import { VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';

interface ModelSelectDropdownProps {
  message: MessageStore;
  handleRefresh: (messageId: string, model: string) => void;
}

const ModelSelectDropdown: React.FC<ModelSelectDropdownProps> = ({
  message,
  handleRefresh,
}) => {
  const { chatModelList } = useChatContext();

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
        {chatModelList.map((chatModel) => (
          <VSCodeOption
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
            }}
            key={chatModel.modelKey}
            value={chatModel.modelKey}
          >
            {chatModel.modelName}
          </VSCodeOption>
        ))}
      </VSCodeDropdown>
    </>
  );
};

export default ModelSelectDropdown;