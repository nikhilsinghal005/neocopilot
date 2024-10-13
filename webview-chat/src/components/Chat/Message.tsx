import React from 'react';
import { Message } from '../../types/Message';
import MessageRenderer from './MessageRenderer';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = React.memo(({ message }) => {
  return (
    <div
      className={`message flex ${
        message.messageType === 'user' ? 'justify-end' : 'justify-start'
      } items-start mb-2 w-full`}
    >
      {message.messageType !== 'user' && (
        <div className="flex items-center mr-1">
          <span className="codicon codicon-person text-gray-400"></span>
        </div>
      )}
      <div
        className={`p-2 rounded-md max-w-[93%] break-words shadow-md ${
          message.messageType === 'user'
            ? 'bg-vscode-chat-message-outgoing text-white'
            : 'bg-vscode-chat-message-incoming text-gray-200'
        }`}
      >
        <span className="block text-base font-semibold mb-2 opacity-75">
          {message.messageType === 'user' ? 'You' : 'NEO'} ·{' '}
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <MessageRenderer text={message.text} />
      </div>
      {message.messageType === 'user' && (
        <div className="flex items-center ml-1">
          <span className="codicon codicon-check text-gray-400"></span>
        </div>
      )}
    </div>
  );
});

export default MessageComponent;
