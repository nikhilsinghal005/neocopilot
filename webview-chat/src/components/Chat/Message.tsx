import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import CodeButtonWithText from '../Common/CodeButtonWithText';
import { MessageStore, CurrentFileContext, UploadedImage } from '../../types/Message';
import { useVscode } from '../../context/VscodeContext';
import MessageRenderer from './MessageRenderer';
import ModelSelectDropdown from '../Common/ModelSelectDropdown';
import InputBar from '../InputBarChat/InputBar';

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
    attachedContext,
    setAttachedContext,
    previousChatModel,
    chatModel,
    setChatModel,
    setPreviousChatModel,
    previousInput,
    setPreviousInput,
    input,
    setInput,
    previousAttachedContext,
    setPreviousAttachedContext,
    uploadImage,
    setUploadImage,
    previousUploadImage,
    setPreviousUploadImage,
  } = useChatContext();

  const vscode = useVscode();

  // Separate state to track which message is being edited
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

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
    // console.log('handleEditButtonClick');
    // console.log('Current Editable Message ID: ', messageId);
    // console.log('Current Editable Message: ',message)

    // Store the current input values
    setPreviousInput(input);
    setPreviousChatModel(chatModel);
    setPreviousAttachedContext(attachedContext);
    setPreviousUploadImage(uploadImage);

    // Setting Up new input Box and replce the old one
    setIsEditing(true); // Now a boolean
    setEditingMessageId(messageId); // Track the specific message ID
    setAttachedContext(message.attachedContext ?? ([] as CurrentFileContext[]));
    setChatModel(message.modelSelected || "");
    setUploadImage(message.uploadedImages ?? ([] as UploadedImage[]));
    setInput(message.text);
     // Set the attached context of the message
  };

  const handleEditSave = () => {
    let editingMessage = null;
    // Pop messages until we find the message to edit (user1)
    while (chatSession.messages.length > 0) {
      const poppedMessage = chatSession.messages.pop();
      if (poppedMessage?.id === editingMessageId) {
        editingMessage = poppedMessage;
        break;
      }
    }
    if (!editingMessage) {
      console.error("Editing message not found.");
      return;
    }
    editingMessage.text = input;
    editingMessage.attachedContext = attachedContext;
    editingMessage.modelSelected = chatModel;
    chatSession.messages = [editingMessage];
    setChatSession({ ...chatSession });
    setIsEditing(false);
    setEditingMessageId(null); // Reset the editing message ID
    vscode.postMessage({
      command: "send_chat_message",
      data: chatSession,
    });
    // Reset inputs
    setInput(previousInput);
    setChatModel(previousChatModel);
    setAttachedContext(previousAttachedContext);
    setUploadImage(previousUploadImage);
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
                attachedContext={message.attachedContext ?? ([] as CurrentFileContext[])}
                uploadedImage={message.uploadedImages ?? ([] as UploadedImage[])}
              />
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
              {message.messageType  !== 'user' && <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default MessageComponent;
