// src/components/Chat/ChatContainer.tsx
import React from 'react';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
// import InputBar from './InputBar';
import InputBar from "../InputBarUpdated/InputBar";
import { useChatContext } from '../../context/ChatContext';
import NewChatPanel from './NewChatPanel';

interface ChatContainerProps {
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  handleSendMessage: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  input,
  setInput,
  isTyping,
  handleSendMessage,
}) => {
  const { chatSession } = useChatContext(); // Access chatSession from the context

  // Ensure that chatSession and chatSession.messages are defined
  const hasMessages = chatSession && Array.isArray(chatSession.messages) && chatSession.messages.length > 0;

  return (
    <div className="chat-page flex flex-col flex-grow w-full h-full">
      {/* Conditional rendering for NewChatPanel */}
      {!hasMessages ? (
        <NewChatPanel />
      ) : (
        <>
          {/* Messages Container */}
          <div
            className="messages-container fixed left-0 right-0 overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-3 pt-2"
            style={{
              top: '40px',
              bottom: `calc(var(--input-container-height, 130px) + 0px)`, // Adjusted to match the dynamic height of input container
            }}
          >
            <MessageList chatSession={chatSession} />
            {isTyping && <TypingIndicator />}
          </div>
        </>
      )}

      {/* Input Container */}
      <div
        className="input-container absolute left-0 right-0 bg-vscode-editor-background pl-0 pr-0 shadow-md flex items-center"
        style={{
          minHeight: '110px',
          maxHeight: '200px',
          height: 'var(--input-container-height, 130px)',
          bottom: '20px',
          transform: `translateY(calc(100% - var(--input-container-height, 130px)))`,
          transition: 'transform 0.3s ease, height 0.3s ease',
        }}
      >
        <InputBar
          input={input}
          setInput={setInput}
          handleSendMessage={handleSendMessage}
          isTyping={isTyping} // Pass isTyping prop
        />
      </div>
    </div>
  );
};

export default ChatContainer;
