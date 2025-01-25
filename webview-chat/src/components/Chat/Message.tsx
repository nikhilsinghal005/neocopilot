import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import CodeButtonWithText from '../Common/CodeButtonWithText';
import { MessageStore, CurrentFileContext } from '../../types/Message';
import { useVscode } from '../../context/VscodeContext';
import MessageRenderer from './MessageRenderer';
import ModelSelectDropdown from '../Common/ModelSelectDropdown';
import InputBar from '../InputBarUpdated/InputBar';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  const {
    chatSession,
    setChatSession,
    setIsTyping,
    isTyping,
    chatModelList,
    setChatModelList,
    setIsEditing,
    isEditing,
  } = useChatContext();

  const vscode = useVscode();

  // Separate state to track which message is being edited
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [editInput, setEditInput] = useState(message.text);

  const handleRefresh = (messageId: string, model: string) => {
    while (true) {
      const poppedMessage: MessageStore | undefined = chatSession.messages.pop();
      if (poppedMessage?.id === messageId) {
        break;
      }
    }
    const lastMessage = chatSession.messages[chatSession.messages.length - 1];
    lastMessage.modelSelected = model;
    setChatSession({ ...chatSession });
    setIsTyping(true);
    vscode.postMessage({
      command: 'send_chat_message',
      data: chatSession,
    });
  };

  const handleCopy = (messageId: string) => {
    const messageToCopy = chatSession.messages.find((message) => message.id === messageId);
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy.text);
    }
  };

  const handleEditButtonClick = (messageId: string) => {
    setIsEditing(true); // Now a boolean
    setEditingMessageId(messageId); // Track the specific message ID
  };

  const handleEditSave = () => {
    const messageToEdit = chatSession.messages.find((msg) => msg.id === message.id);
    if (messageToEdit) {
      messageToEdit.text = editInput;
      setChatSession({ ...chatSession });
      setIsEditing(false); // End editing mode
      setEditingMessageId(null); // Reset the editing message ID
    }
  };

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.command === 'update_chat_details') {
        const { model_details } = event.data;
        if (model_details) {
          setChatModelList(model_details);
        }
      }
    };
    window.addEventListener('message', messageHandler);
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [setChatModelList]);

  return (
    <>
      <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>

      {editingMessageId === message.id && isEditing ? (
        <div className="w-full">
          <InputBar
            input={editInput}
            setInput={setEditInput}
            handleSendMessage={handleEditSave}
            isTyping={isTyping}
          />
        </div>
      ) : (
        <div className={`message flex justify-center items-start mb-5 w-full`}>
          <div
            className={`rounded-sm flex items-center break-words px-2 max-w-[97%] text-vscode-editor-foreground`}
            style={{
              backgroundColor:
                message.messageType === 'user'
                  ? 'var(--vscode-input-background)'
                  : undefined,
              border: message.messageType === 'user'
                ? '2px solid var(--vscode-editorGroup-border)'
                : undefined,
              overflowX: 'auto',
              flexGrow: 1,
              minWidth: '97%',
            }}
          >
            <div className="w-full">
              <MessageRenderer
                text={message.text}
                type={message.messageType}
                attachedContext={message.attachedContext ?? ([] as CurrentFileContext[])}
              />
              {message.messageType === 'user' && (
                <div className="flex justify-end">
                  <CodeButtonWithText
                    onClick={() => handleEditButtonClick(message.id)}
                    ariaLabel="Edit"
                    icon="codicon-edit"
                    tooltip="Edit"
                    disabled={isTyping}
                    buttonName="Edit"
                  />
                </div>
              )}
              {message.messageType === 'system' && !isTyping && (
                <div className="flex justify-end">
                {/* Model select dropdown component */}
                  <ModelSelectDropdown
                    message={message}
                    handleRefresh={handleRefresh}
                  />
                  <CodeButtonWithText
                    onClick={() => handleCopy(message.id)}
                    ariaLabel="Copy"
                    icon="codicon-copy"
                    tooltip="Copy"
                    disabled={isTyping}
                    buttonName={''}
                  />
                </div>
              )}
              <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MessageComponent;
