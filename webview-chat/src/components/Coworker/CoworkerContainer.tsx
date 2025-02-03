// src/components/Coworker/CoworkerContainer.tsx
import React from 'react';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';
import InputBar from '../InputBarCoworker/InputBar';
import { useCoworkerContext } from '../../context/CoworkerContext';
import NewChatPanel from './NewChatPanel';

interface CoworkerContainerProps {
  input: string;
  setInput: (input: string) => void;
  isTyping: boolean;
  handleSendMessage: () => void;
}

const CoworkerContainer: React.FC<CoworkerContainerProps> = ({
  input,
  setInput,
  isTyping,
  handleSendMessage,
}) => {
  const { coworkerSession, isEditing } = useCoworkerContext(); // Access coworkerSession from the context

  // Ensure that coworkerSession and coworkerSession.messages are defined
  const hasMessages = coworkerSession && Array.isArray(coworkerSession.messages) && coworkerSession.messages.length > 0;

  return (
    <div className="coworker-page flex flex-col flex-grow w-full h-full">
      {/* Conditional rendering for NewChatPanel */}
      {!hasMessages ? (
        <NewChatPanel />
      ) : (
        <>
          {/* Messages Container */}
          <div
            className="messages-container fixed left-0 right-0 overflow-y-auto bg-vscode-editor-background text-vscode-editor-foreground pb-4 pt-2"
            style={{
              top: '40px',
              bottom: `calc(var(--input-container-height, 130px) + 0px)`, // Adjusted to match the dynamic height of input container
            }}
          >
            <MessageList coworkerSession={coworkerSession} />
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

export default CoworkerContainer;
