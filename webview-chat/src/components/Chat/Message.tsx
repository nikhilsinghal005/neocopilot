import React, { useState, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { MessageStore, CurrentFileContext } from '../../types/Message';
import { useVscode } from '../../context/VscodeContext';
import MessageRenderer from './MessageRenderer';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  const { chatSession, setChatSession, setIsTyping, isTyping, chatModelList, setChatModelList } = useChatContext();
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);

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
              <div className='flex justify-end'>
                <VSCodeButton
                  appearance='icon'
                  onClick={() => handleCopy(message.id)}
                  className ="hover:bg-vscode-button-background hover:text-vscode-button-foreground mt-1"
                >
                  <span className='codicon codicon-copy' style={{ fontSize: '12px' }}></span>
                </VSCodeButton>
                <div className='relative'>
                <VSCodeButton
                  onClick={() => setDropdownVisible(!dropdownVisible)}
                  aria-label={"Refresh"}
                  appearance="icon"
                  className="inline-flex items-center justify-center h-6 px-1 hover:bg-vscode-button-background hover:text-vscode-button-foreground"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                  >
                  <div className="flex items-center hover:bg-vscode-button-background hover:text-vscode-button-foreground" style={{ fontSize: '12px' }}>
                    <span className={`codicon codicon-refresh mr-1`} style={{ fontSize: '12px' }}></span>
                    {message.modelSelected === 'neo-1' ? 'Neo-Basic' : 'Neo-Expert'}
                  </div>
                </VSCodeButton>
                {dropdownVisible && (
                  <div
                    className="absolute right-0 mt-0 w-56 border rounded shadow-md z-10 p-0 dropdown-container mr-1"
                    style={{
                      backgroundColor: 'var(--vscode-editor-background)',
                      borderColor: 'var(--vscode-editorGroup-border)',
                      color: 'var(--vscode-editor-foreground)',
                      overflow: 'hidden',
                      bottom: '100%', // Position the dropdown above the button
                      transform: 'translateY(-10px)',
                    }}
                  >
                    {chatModelList.map((chatModel) => (
                      <div
                        key={chatModel.modelKey}
                        onClick={() => {
                          setDropdownVisible(false);
                          handleRefresh(message.id, chatModel.modelKey);
                        }}
                        className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                        style={{
                          borderColor: 'var(--vscode-editorGroup-border)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                          e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                          e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                        }}
                      >
                        <span className="truncate">{chatModel.modelName}</span>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

export default MessageComponent;