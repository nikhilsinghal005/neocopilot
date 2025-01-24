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
    <VSCodeDropdown
      className="rounded-md h-5"
      style={{
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '10px'
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
      onChange={(e) => { handleRefresh(message.id, (e.target as HTMLSelectElement).value) }}
    >
      {chatModelList.map((chatModel) => (
        <VSCodeOption key={chatModel.modelKey} value={chatModel.modelKey}>
          {chatModel.modelName}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};

export default ModelSelectDropdown;
