// src/components/Chat/ChatContainer.tsx
import React from 'react';
import { Message } from '../../types/Message';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';

interface ChatContainerProps {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  handleSendMessage: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, input, setInput, isTyping, handleSendMessage }) => {
  return (
    <div className="chat-container flex flex-col h-full w-full p-0 bg-vscode-editor-background text-vscode-editor-foreground">
      {/* Messages List */}
      <MessageList messages={messages} />

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      {/* Input Bar */}
      <InputBar input={input} setInput={setInput} handleSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;
