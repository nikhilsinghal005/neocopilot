import React, { useRef, useEffect } from 'react';
import { Message } from '../../types/Message';
import MessageComponent from './Message';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the latest message when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="messages-container flex-1 overflow-y-auto p-0 bg-vscode-editor-background">
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
