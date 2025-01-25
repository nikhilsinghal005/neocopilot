import React from 'react';
import { useChatContext } from '../../context/ChatContext';
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
          vscode-dropdown::part(control) {
            font-size: 11px; /* Adjust the font size as needed */
            border: none;
            border-radius: 7%;
          }
          vscode-option::part(control) {  
            font-size: 11px; /* Adjust the font size as needed */
            border: none;
            border-radius: 7%;
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
          e.currentTarget.style.borderRadius = '7%';
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
