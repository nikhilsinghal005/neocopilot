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

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  input,
  setInput,
  isTyping,
  handleSendMessage,
}) => {
  return (
    <div className="chat-page flex flex-col flex-grow w-full h-full">
      {/* Messages Container */}
      <div className="messages-container fixed top-0 left-0 right-0 bottom-[80px] top-[40px] overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-4 pt-2">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>
      <div className="divider-line fixed bottom-[80px] w-full h-[1px] bg-gray-600"></div>

      {/* Input Container */}
      <div className="input-container fixed left-0 right-0 bottom-0 h-[80px] bg-vscode-editor-background pl-0 pr-0 shadow-md flex items-center">
        <InputBar
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
