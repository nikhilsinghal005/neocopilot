// InputBar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useCoworkerContext } from '../../context/CoworkerContext';
import {
  useHandleIncomingMessages,
  sanitizeInput,
  handleSendClick,
} from '../../hooks/InputBarUtils';
import ContextWrapper from './ContextWrapper';
import ChatControls from './ChatControls';
import { useVscode } from '../../context/VscodeContext';
import {handlePaste} from '../../hooks/InputBarUtils';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
  isEditing: boolean;
}

const InputBar: React.FC<InputBarProps> = ({
  input,
  setInput,
  handleSendMessage,
  isTyping,
  isEditing,
}) => {
  const [warningMessage, setWarningMessage] = useState('');
  const vscode = useVscode();
  const {
    attachedContext,
    setAttachedContext,
    openEditorFilesList,
    setOpenEditorFilesList,
    setIsTyping,
    setIsInterrupted,
    setUploadImage,
    coworkerSession,
    uploadImage
  } = useCoworkerContext();

  // Handle incoming messages using the custom hook
  useHandleIncomingMessages({
    setInput,
    attachedContext,
    setAttachedContext,
    openEditorFilesList,
    setOpenEditorFilesList,
    vscode
  });

  // Dynamically resize textarea
  const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 140);
      textarea.style.height = `${newHeight}px`;
      document.documentElement.style.setProperty(
        '--input-container-height',
        `${newHeight + 40}px`
      );
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [input, isTyping, handleResize]);

  const placeholderStyle = `
  .input-textarea::placeholder {
    font-size: 12px;
  }
`;

return (
  <div className="complete-wrapper w-full h-full flex flex-col items-center px-1 pt-0">
    {/* Context Wrapper */}
    

    {/* Chat Wrapper */}
    <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-0">
    
      <div
        className="input-container flex flex-col gap-0 w-full max-w-2xl p-1 border-2 rounded-md"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
        }}
      >
        <ContextWrapper isTyping={isTyping} isEditing={isEditing} />
        {/* Textarea */}
        <div className="top-section flex items-center gap-2 text-xxs">
        <style>{placeholderStyle}</style>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleResize();
            }}
            onPaste={(e) => handlePaste(e, setUploadImage,coworkerSession.coworkerId,vscode,uploadImage, setInput)}
            className="flex-grow bg-transparent outline-none px-2 py-1 resize-none input-textarea text-xxs rounded-md"
            placeholder="Type your message..."
            style={{
              color: 'var(--vscode-editor-foreground)',
              minHeight: '50px',
              backgroundColor: 'transparent',
              outline: 'none',
            }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() === '') {
                  // setWarningMessage('Cannot send an empty message.');
                  setTimeout(() => setWarningMessage(''), 2000);
                  return;
                }
                handleSendClick(
                  isTyping,
                  setWarningMessage,
                  setIsInterrupted,
                  sanitizeInput,
                  input,
                  setInput,
                  handleSendMessage,
                  setIsTyping
                );
                setUploadImage([]);
              }
            }}
          />
        </div>

        {/* Bottom Section */}
        <div
          className="bottom-section flex justify-end items-center gap-2 mt-0 p-0"
        >
          {/* Chat Model Dropdown */}
          {/* <ChatModelDropdown /> */}

          {/* Chat Controls */}
          <ChatControls
            input={input}
            setInput={setInput}
            warningMessage={warningMessage}
            setWarningMessage={setWarningMessage}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      </div>

      {/* Warning Message */}
      {warningMessage && (
        <div className="text-sm mt-1" style={{ color: 'var(--vscode-errorForeground)' }}>
          {warningMessage}
        </div>
      )}
    </div>
  </div>
);
};
export default InputBar;
