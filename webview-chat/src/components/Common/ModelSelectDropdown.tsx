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
    <select
      className="rounded-md h-5"
      style={{
        backgroundColor: 'transparent',
        fontSize: '10px',
        lineHeight: '12px',
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
      onChange={(e)=>{handleRefresh(message.id,e.target.value)}}
    >
      {chatModelList.map((chatModel) => (
        <option key={chatModel.modelKey} value={chatModel.modelKey}>
          {chatModel.modelName}
        </option>
      ))}
    </select>
  );
};

export default ModelSelectDropdown;
