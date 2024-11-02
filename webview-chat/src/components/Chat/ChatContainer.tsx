// src/components/Chat/ChatContainer.tsx
import React from 'react';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';
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
          <div className="messages-container fixed left-0 right-0 bottom-[100px] top-[40px] overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-4 pt-2">
            <MessageList chatSession={chatSession} />
            {isTyping && <TypingIndicator />}
          </div>
        </>
      )}

      {/* Divider Line */}
      <div className="divider-line fixed bottom-[100px] left-0 right-0 w-full h-[1px] bg-gray-600 m-0 p-0"></div>

      {/* Input Container */}
      <div className="input-container fixed left-0 right-0 bottom-0 h-[100px] bg-vscode-editor-background pl-0 pr-0 shadow-md flex items-center">
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
