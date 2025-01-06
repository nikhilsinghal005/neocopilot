import React from 'react';
import { MessageStore } from '../../types/Message';
import MessageRenderer from './MessageRenderer';

interface MessageProps {
  message: MessageStore;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  return (
    <>
      {/* Divider line after each message */}
      <div className="divider-line w-full h-[1px] m-0 p-0 py-1 bg-opacity-0"></div>

      <div
        className={`message flex justify-center items-start mb-2 w-full`}
      >
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
          className={`rounded-sm flex items-center break-words px-2 max-w-[97%] bg-vscode-chat-message-incoming text-vscode-editor-foreground`}
          style={{
            backgroundColor:
              message.messageType === 'user'
                ? 'var(--vscode-editor-background)'
                : undefined,
            overflowX: 'auto',
            flexGrow: 1,
            minWidth: '97%',
          }}
        >
          <span
            className={`block text-xs font-semibold mb-2 opacity-75 ${
              message.messageType === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            {/* {' '}
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })} */}
          </span>
          <MessageRenderer text={message.text} type={message.messageType} />
        </div>

        {/* Check mark on the right for the user's messages */}
        {/* {message.messageType === 'user' && (
          <div className="flex items-center ml-1 mt-1">
            <span 
              className="codicon codicon-account text-vscode-editor-foreground mr-1"
              style={{ fontSize: '12px' }}
            ></span>
          </div>
        )} */}
      </div>
    </>
  );
});

export default MessageComponent;
