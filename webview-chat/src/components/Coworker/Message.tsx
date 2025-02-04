import React, { useState} from 'react';
import { useCoworkerContext } from '../../context/CoworkerContext';
import CodeButtonWithText from '../Common/CodeButtonWithText';
import {MessageStore, CurrentFileContext, UploadedImage } from '../../types/CoworkerMessage';
import MessageRenderer from './MessageRenderer';
import { useVscode } from '../../context/VscodeContext';
import InputBar from '../InputBarCoworker/InputBar';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {

  const {
      coworkerSession,
      setCoworkerSession,
      setIsTyping,
      isTyping,
      setIsEditing,
      isEditing,
      attachedContext,
      setAttachedContext,
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
    } = useCoworkerContext();
  const vscode = useVscode();

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
    const handleRefresh = (messageId: string) => {
      const messageIndex = coworkerSession.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) {
          console.error("Refresh message not found.");
          return;
      }
      const updatedMessages = coworkerSession.messages.slice(0, messageIndex + 1);
      updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          text: input,
          attachedContext: attachedContext,
      };
      coworkerSession.messages = updatedMessages;
      setCoworkerSession({ ...coworkerSession });
      setIsTyping(true);
      vscode.postMessage({
        command: 'send_chat_message',
        data: coworkerSession,
      });
    };
  
    const handleCopy = (messageId: string) => {
      const messageToCopy = coworkerSession.messages.find((message) => message.id === messageId);
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
      setPreviousAttachedContext(attachedContext);
      setPreviousUploadImage(uploadImage);
  
      // Setting Up new input Box and replce the old one
      setIsEditing(true); // Now a boolean
      setEditingMessageId(messageId); // Track the specific message ID
      setAttachedContext(message.attachedContext ?? ([] as CurrentFileContext[]));
      setUploadImage(message.uploadedImages ?? ([] as UploadedImage[]));
      setInput(message.text);
       // Set the attached context of the message
    };
  
    const handleEditSave = () => {
      const messageIndex = coworkerSession.messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) {
          console.error("Editing message not found.");
          return;
      }
      const updatedMessages = coworkerSession.messages.slice(0, messageIndex + 1);
      updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          text: input,
          attachedContext: attachedContext,
      };
      coworkerSession.messages = updatedMessages;
      setCoworkerSession({ ...coworkerSession });
      setIsEditing(false);
      setEditingMessageId(null); // Reset the editing message ID
      vscode.postMessage({
        command: "send_chat_message",
        data: coworkerSession,
      });
      // Reset inputs
      setInput(previousInput);
      setAttachedContext(previousAttachedContext);
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
              {/* {message.messageType === 'user' && (
                <div className="absolute top-1 right-1 z-10">
                  <CodeButtonWithText
                    onClick={() => handleEditButtonClick(message.id)}
                    ariaLabel="Edit"
                    icon="codicon-edit"
                    tooltip="Edit"
                    disabled={isTyping}
                  />
                </div>
              )} */}
              <div className="w-full">
                <MessageRenderer
                  text={message.text}
                  type={message.messageType}
                  attachedContext={message.attachedContext ?? ([] as CurrentFileContext[])}
                  uploadedImage={message.uploadedImages ?? ([] as UploadedImage[])}
                />
                {message.messageType === 'system' && !isTyping && (
                  <div className="flex justify-end">
                  {/* <CodeButtonWithText
                      onClick={() => handleRefresh(message.id)}
                      ariaLabel="Refresh"
                      icon="codicon-refresh"
                      tooltip="Copy"
                      disabled={isTyping}
                      buttonName={''}
                    /> */}
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
