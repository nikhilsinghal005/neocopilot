import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import CodeButtonWithText from '../Common/CodeButtonWithText';
import { MessageStore, CurrentFileContext } from '../../types/Message';
import { useVscode } from '../../context/VscodeContext';
import MessageRenderer from './MessageRenderer';
import ModelSelectDropdown from '../Common/ModelSelectDropdown';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  const { chatSession, setChatSession, setIsTyping, isTyping, chatModelList, setChatModelList } = useChatContext();

  const vscode = useVscode();

  const handleRefresh = (messageId: string, model: string) => {
    while (true) {
      const poppedMessage: MessageStore | undefined = chatSession.messages.pop()
      if (poppedMessage?.id === messageId) {
        break
      }
    }
    //update modelselected in last message
    const lastMessage = chatSession.messages[chatSession.messages.length - 1]
    lastMessage.modelSelected = model
    setChatSession({ ...chatSession })
    setIsTyping(true)
    vscode.postMessage({
      command: 'send_chat_message',
      data: chatSession,
    })
  };
  console.log(chatSession.messages)
  const handleCopy = (messageId: string) => {
    const messageToCopy = chatSession.messages.find((message) => message.id === messageId);
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy.text);
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
      {/* Divider line after each message */}
      <div className='divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0'></div>

      <div className={`message flex justify-center items-start mb-5 w-full`}>
        {/* Icon on the left for NEO's messages */}
        {/* {message.messageType !== 'user' && (
          <div className="flex items-center mr-1 mt-3">
            <span 
              className="codicon codicon-robot text-vscode-editor-foreground"
              style={{ fontSize: '12px' }}
            ></span>
          </div>
        )} */}

        {/* Message box */}
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
          <div className='w-full'>
            <MessageRenderer
              text={message.text}
              type={message.messageType}
              attachedContext={message.attachedContext ?? ([] as CurrentFileContext[])}
            />
            {message.messageType === 'system' && !isTyping && (
              <div className="flex justify-end">
                <CodeButtonWithText
                  onClick={() => handleCopy(message.id)}
                  ariaLabel="Copy"
                  icon="codicon-copy"
                  tooltip="Copy"
                  disabled={isTyping}
                  buttonName={''}
                />
                {/* Model select dropdown component */}
                <ModelSelectDropdown
                  message={message}
                  handleRefresh={handleRefresh}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default MessageComponent;