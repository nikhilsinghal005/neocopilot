// Message.tsx
import React from 'react';
import { MessageStore } from '../../types/Message';
import MessageRenderer from './MessageRenderer';
import { CurrentFileContext } from '../../types/Message';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { useChatContext } from '../../context/ChatContext'
import { useVscode } from '../../context/VscodeContext'

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  const { 
    chatSession, 
    setChatSession,
    setIsTyping,
    isTyping
  } = useChatContext()

  const vscode = useVscode()

  const handleRefresh = (messageId: string) => {
    while(true){
      const poppedMessage:MessageStore | undefined = chatSession.messages.pop()
      if(poppedMessage?.id === messageId){
        break
      }
    }
    setChatSession({ ...chatSession })
    setIsTyping(true)
    vscode.postMessage({
      command: 'send_chat_message',
      data: chatSession,
    })
  }

  const handleCopy = (messageId: string) => {
    const messageToCopy = chatSession.messages.find(message => message.id === messageId)
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy.text)
    }
  }

  return (
    <>
    {/* Divider line after each message */}
      <div className='divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0'></div>

      <div className={`message flex justify-center items-start mb-2 w-full`}>
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
            border:message.messageType === 'user'
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
              <div className='flex justify-end mt-2'>
                <VSCodeButton
                  appearance='icon'
                  onClick={() => handleCopy(message.id)}
                >
                  <span className='codicon codicon-copy' style={{ fontSize: '12px' }}></span>
                </VSCodeButton>
                <VSCodeButton
                  appearance='icon'
                  onClick={() => handleRefresh(message.id)}
                >
                  <span className='codicon codicon-refresh' style={{ fontSize: '12px' }}></span>
                </VSCodeButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default MessageComponent;