import React, { useState } from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import CodeButtonWithText from '../../../shared/components/common/CodeButtonWithText';
import { MessageStore, UploadedImage } from '../../../shared/types/Message';
import { AgentDetail } from '../../../shared/types/AppDetails';
import { sanitizeChatSession } from '../../../shared/utils/serialization';
import { ChatSession } from '../../../shared/types/Message';
import { useVscode } from '../../../integration/vscode/api';
import MessageRenderer from './MessageRenderer';
import AgentTypeSelectDropdown from '../../../shared/components/common/AgentTypeSelectDropdown';
import InputBar from '../../../shared/components/input-bar/InputBar';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const {
    chatSession,
    setChatSession,
    setIsTyping,
    isTyping,
    setIsEditing,
    isEditing,
    previousAgentType,
    agentType,
    setAgentType,
    setPreviousAgentType,
    previousInput,
    setPreviousInput,
    input,
    setInput,
    uploadImage,
    setUploadImage,
    previousUploadImage,
    setPreviousUploadImage,
  } = useChatContext();

  const vscode = useVscode();

  // Separate state to track which message is being edited
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleRefresh = (messageId: string, agent: AgentDetail) => {
    const messageIndex = chatSession.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      console.error('Message to refresh not found.');
      return;
    }
    // Keep messages up to the refreshed one
    chatSession.messages = chatSession.messages.slice(0, messageIndex + 1);
    const lastMessage = chatSession.messages[chatSession.messages.length - 1];
  lastMessage.selectedAgent = agent;
    setChatSession({ ...chatSession });
    setIsTyping(true);
    const serialized = sanitizeChatSession(chatSession as ChatSession);
    vscode.postMessage({
      command: 'send_chat_message',
      data: {
  chatSession: serialized,
  selectedAgent: serialized.messages[serialized.messages.length - 1]?.selectedAgent,
        userMessage: {
          text: lastMessage.text,
          images: (lastMessage.uploadedImages || []).map(img => ({
            fileName: img.fileName,
            filePath: img.filePath,
            fileType: img.fileType,
            fileContent: img.fileContent,
            isActive: img.isActive,
            isManuallyAddedByUser: img.isManuallyAddedByUser
          }))
        },
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleCopy = (messageId: string) => {
    const messageToCopy = chatSession.messages.find((message) => message.id === messageId);
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy.text);
    }
  };

  const handleEditButtonClick = (messageId: string) => {
    console.log('handleEditButtonClick');
    console.log('Current Editable Message ID: ', messageId);
    console.log('Current Editable Message: ',message)

    // Store the current input values
    setPreviousInput(input);
    setPreviousAgentType(agentType);
    setPreviousUploadImage(uploadImage);

    // Setting Up new input Box and replce the old one
    setIsEditing(true); // Now a boolean
    setEditingMessageId(messageId); // Track the specific message ID
  setAgentType(message.selectedAgent || { agentId: 'ask', agentName: 'Ask', agentDescription: '', icon: <></> });
    setUploadImage(message.uploadedImages ?? ([] as UploadedImage[]));
    setInput(message.text);
    // Context already applied
  };

  const handleEditSave = () => {
    const messageIndex = chatSession.messages.findIndex(msg => msg.id === editingMessageId);
    if (messageIndex === -1) {
      console.error('Editing message not found.');
      return;
    }
    const updatedMessages = chatSession.messages.slice(0, messageIndex + 1);
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
  text: input,
  selectedAgent: agentType
    };
    chatSession.messages = updatedMessages;
    setChatSession({ ...chatSession });
    setIsEditing(false);
    setEditingMessageId(null);
    const serialized = sanitizeChatSession(chatSession as ChatSession);
    const editedMsg = serialized.messages[serialized.messages.length - 1];
    vscode.postMessage({
      command: 'send_chat_message',
      data: {
  chatSession: serialized,
  selectedAgent: editedMsg?.selectedAgent,
        userMessage: {
          text: editedMsg?.text || '',
          images: editedMsg?.uploadedImages || []
        },
        timestamp: new Date().toISOString()
      }
    });
    // Reset inputs
    setInput(previousInput);
    setAgentType(previousAgentType);
    setUploadImage(previousUploadImage);
  };
  

  return (
    <>
      <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>

      {editingMessageId === message.id && isEditing ? (
        <div className="w-full">
          <InputBar
            input={input}
            setInput={setInput}
            handleSendMessage={handleEditSave}
            isTyping={isTyping}
            isEditing={isEditing}
          />
        </div>
      ) : (
        <div className={`message flex justify-center items-start mb-5 w-full`}>
          <div
            className={`rounded-sm flex items-center break-words px-2 max-w-[97%] text-vscode-editor-foreground relative`}
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
              zIndex: 2,
            }}
          >
            {message.messageType === 'user' && (
              <div className="absolute top-1 right-1 z-10">
                <CodeButtonWithText
                  onClick={() => handleEditButtonClick(message.id)}
                  ariaLabel="Edit"
                  icon="codicon-edit"
                  tooltip="Edit"
                  disabled={isTyping}
                />
              </div>
            )}
            <div className="w-full">
              <MessageRenderer
                text={message.text}
                type={message.messageType}
                uploadedImage={message.uploadedImages ?? ([] as UploadedImage[])}
              />
              {message.messageType === 'system' && !isTyping && (
                <div className="flex justify-end">
                {/* Model select dropdown component */}
                  <AgentTypeSelectDropdown
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
              {message.messageType  !== 'user' && <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageComponent;
