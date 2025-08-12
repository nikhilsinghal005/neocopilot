// src/components/Chat/ChatContainer.tsx
import React from 'react';
// Import siblings directly to avoid self-referential barrel causing build resolution issues
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import NewChatPanel from './NewChatPanel';
import InputBar from '../../../shared/components/input-bar/InputBar';
import { useChatContext } from '../state/chatTypes';

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
  const { chatSession, isEditing } = useChatContext(); // Access chatSession from the context

  // Ensure that chatSession and chatSession.messages are defined
  const hasMessages = chatSession && Array.isArray(chatSession.messages) && chatSession.messages.length > 0;

  return (
    <div className="chat-page flex flex-col flex-grow w-full h-full">
      {/* Conditional rendering for NewChatPanel */}
      {!hasMessages ? (
        <div
        className="messages-container fixed left-0 right-0 overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-4 pt-2"
        style={{
          top: '50px',
          bottom: `calc(var(--input-container-height, 150px) + 10px)`, // Adjusted to match the dynamic height of input container
        }}
      >
        <NewChatPanel />
      </div>
      ) : (
        <>
          {/* Messages Container */}
          <div
            className="messages-container fixed left-0 right-0 overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-4 pt-2"
            style={{
              top: '50px',
              bottom: `calc(var(--input-container-height, 150px) + 10px)`, // Adjusted to match the dynamic height of input container
            }}
          >
            <MessageList chatSession={chatSession} />
            {isTyping && <TypingIndicator />}
          </div>
        </>
      )}

      {/* Input Container */}
      {!isEditing && (
        <div
          className="input-container absolute left-0 right-0 bg-vscode-editor-background pl-0 pr-0 shadow-md flex items-center"
          style={{
            // minHeight: '130px',
            // maxHeight: '220px',
            // height: 'var(--input-container-height, 130px)',
            bottom:  '2px',
            // transform: `translateY(calc(100% - var(--input-container-height, 130px)))`,
            // transition: 'transform 0.3s ease, height 0.3s ease',
          }}
        >
          <InputBar
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping} // Pass isTyping prop
            isEditing={isEditing}
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
