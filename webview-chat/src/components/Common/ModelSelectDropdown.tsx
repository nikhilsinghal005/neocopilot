import React from 'react';
import { useChatContext } from '../../context/ChatContext';
import { MessageStore } from '../../types/Message';

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
    <div
      className="flex items-center rounded-md p-1"
      style={{
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor =
          'var(--vscode-button-background)';
        e.currentTarget.style.color = 'var(--vscode-button-foreground)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
      }}
    >
      <select
        className="rounded-md p-[0.5]"
        style={{
          backgroundColor: 'transparent',
          fontSize: '10px',
          lineHeight: '12px',
        }}
        value={message.modelSelected}
        onChange={(e) => handleRefresh(message.id, e.target.value)}
      >
        {chatModelList.map((chatModel) => (
          <option key={chatModel.modelKey} value={chatModel.modelKey}>
            {chatModel.modelName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelectDropdown;
