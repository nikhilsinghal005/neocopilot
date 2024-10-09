// src/components/Chat/Message.tsx
import React from 'react';
import { Message } from '../../types/Message';
import MessageRenderer from './MessageRenderer';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  return (
    <div
      className={`message flex ${message.messageType === 'user' ? 'justify-end' : 'justify-start'} items-start mb-3`}
    >
      {message.messageType !== 'user' && (
        <span className="codicon codicon-person text-gray-400 mr-2"></span>
      )}
      <div
        className={`p-3 rounded-lg max-w-full break-words shadow-md ${
          message.messageType === 'user'
            ? 'bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-200'
        }`}
      >
        <span className="block text-xs font-semibold mb-1 opacity-75">
          {message.messageType === 'user' ? 'You' : 'LLM'} ·{' '}
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <MessageRenderer text={message.text} />
      </div>
      {message.messageType === 'user' && (
        <span className="codicon codicon-check text-gray-400 ml-2"></span>
      )}
    </div>
  );
};

export default MessageComponent;
