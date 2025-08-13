// InputBar.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';

import {
  useHandleIncomingMessages,
  sanitizeInput,
  handleSendClick,
} from '../../../features/chat/hooks/InputBarUtils';
import ContextWrapper from './ContextWrapper';
import ChatControls from './ChatControls';
import { useVscode } from '../../../integration/vscode/api';
import {handlePaste} from '../../../features/chat/hooks/InputBarUtils';

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
}) => {
  const [warningMessage, setWarningMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const vscode = useVscode();
  const {
    setIsTyping,
    setIsInterrupted,
    setUploadImage,
    chatSession,
    uploadImage
  } = useChatContext();

  // Handle incoming messages using the custom hook
  useHandleIncomingMessages({
    setInput,
    _setOpenEditorFilesList: () => {},
  });

  // Dynamically resize textarea
 const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 90), 250);
      textarea.style.height = `${newHeight}px`;
      document.documentElement.style.setProperty('--input-container-height', `${newHeight + 40}px`);
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

  // Manage focus styling for any element within the input container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {return;}
    const handleFocusIn = () => setIsFocused(true);
    const handleFocusOut = (e: FocusEvent) => {
      // When focus leaves the container entirely
      if (el && !el.contains((e.relatedTarget as Node) || document.activeElement)) {
        setIsFocused(false);
      }
    };
    el.addEventListener('focusin', handleFocusIn);
    el.addEventListener('focusout', handleFocusOut);
    return () => {
      el.removeEventListener('focusin', handleFocusIn);
      el.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return (
    <div className="complete-wrapper w-full h-full flex flex-col items-center px-1 pt-0">
      {/* Context Wrapper */}
      

      {/* Chat Wrapper */}
      <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-0">
      
        <div
          ref={containerRef}
          className="input-container flex flex-col gap-0 w-full max-w-2xl p-1 rounded-md transition-colors"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderStyle: 'solid',
            borderWidth: isFocused ? '1px' : '2px',
            borderColor: isFocused
              ? 'var(--vscode-focusBorder, var(--vscode-editorGroup-border))'
              : 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          <ContextWrapper />
          {/* Textarea */}
          <div className="top-section flex items-center gap-2 text-xxs">
          <style>{placeholderStyle}</style>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleResize();
              }}
              onPaste={(e) => handlePaste(e, setUploadImage,chatSession.chatId,vscode,uploadImage,setInput)}
              className="flex-grow bg-transparent outline-none px-2 py-1 resize-none input-textarea text-xxs rounded-md"
              placeholder="Type your message..."
              style={{
                color: 'var(--vscode-editor-foreground)',
                minHeight: '40px',
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
            className="bottom-section flex justify-between items-center gap-2 mt-0 p-0"
          >
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
