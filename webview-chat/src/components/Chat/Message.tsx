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
      <div className="divider-line w-full h-[1px] bg-gray-600 m-0 p-0 py-1 bg-opacity-0"></div>
      {/* <div className="divider-line max-w-[98%] h-[1px] bg-gray-300 m-0 p-0 mx-auto"></div> */}
      <div className="divider-line w-full h-[1px] bg-gray-600 m-0 p-0 py-1 bg-opacity-0"></div>

      <div
        className={`message flex ${
          message.messageType === 'user' ? 'justify-end' : 'justify-start'
        } items-start mb-2 w-full`}
      >
        {/* Icon on the left for NEO's messages */}
        {message.messageType !== 'user' && (
          <div className="flex items-center mr-1 mt-1">
            <span 
            className="codicon codicon-person text-gray-400"
            style={{ fontSize: '14px' }}
            ></span>
          </div>
        )}

        {/* Message box */}
        <div
          className={`p-0 rounded-md max-w-[93%] break-words shadow-md ${
            message.messageType === 'user'
              ? 'bg-vscode-chat-message-outgoing text-white'
              : 'bg-vscode-chat-message-incoming text-gray-200'
          }`}
        >
          <span className={`block text-sm font-semibold mb-2 opacity-75 ${message.messageType === 'user' ? 'text-right' : 'text-left'}`}>
            {message.messageType === 'user' ? 'YOU' : 'NEO'} ·{' '}
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <MessageRenderer text={message.text} />
        </div>

        {/* Check mark on the right for the user's messages */}
        {message.messageType === 'user' && (
          <div className="flex items-center ml-1 mt-1">
            <span 
            className="codicon codicon-account text-gray-400 mr-1"
            style={{ fontSize: '14px' }}
            ></span>
          </div>
        )}
      </div>
    </>
  );
});

export default MessageComponent;
