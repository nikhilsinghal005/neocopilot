// src/components/Chat/MessageList.tsx
import React, { useRef, useEffect } from 'react';
import { ChatSession } from '../../types/Message';
import MessageComponent from './Message';

interface MessageListProps {
  chatSession: ChatSession; // Now we receive the entire chat session
}

const MessageList: React.FC<MessageListProps> = ({ chatSession }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the latest message when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession.messages]); // Now dependent on the messages array within chatSession

  return (
    <div
      className="messages-container flex-1 overflow-y-auto p-0 bg-vscode-editor-background"
      style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto', position: 'relative' }}
    >
      {/* Custom scrollbar styles for WebKit browsers */}
      <style>
        {`
          .messages-container::-webkit-scrollbar {
            width: 8px;
          }
          .messages-container::-webkit-scrollbar-thumb {
            visibility: hidden;
            transition: visibility 2s ease;
          }
          .messages-container:hover::-webkit-scrollbar-thumb {
            visibility: visible;
          }
        `}
      </style>
      {chatSession.messages.slice(-60).map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
