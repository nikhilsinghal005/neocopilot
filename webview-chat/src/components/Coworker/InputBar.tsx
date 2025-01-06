// InputBar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeButton, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useCoworkerContext } from '../../context/CoworkerContext';
import { useVscode } from '../../context/VscodeContext';
import { CurrentFileContext, EditorOpenFileList } from '../../types/Message';
import MessageRenderer from './MessageRenderer';
import {
  useHandleIncomingMessages,
  sanitizeInput,
  handleSendClick,
  handleStopClickFunction,
  handleCodeInsertClickFunction,
  handleRemoveTagFunction,
  handleListItemClickFunction,
} from '../../hooks/InputBarUtils';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
  const [warningMessage, setWarningMessage] = useState('');
  const {
    chatModel,
    setChatModel,
    attachedContext,
    setAttachedContext,
    openEditorFilesList,
    setOpenEditorFilesList,
    setIsTyping,
    setIsInterrupted,
  } = useCoworkerContext();
  const vscode = useVscode();
  const [showList, setShowList] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Handle incoming messages using the custom hook
  useHandleIncomingMessages({
    setInput,
    attachedContext,
    setAttachedContext,
    openEditorFilesList,
    setOpenEditorFilesList,
    vscode,
  });

  // Resize textarea dynamically
  const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 140);
      textarea.style.height = `${newHeight}px`;
      document.documentElement.style.setProperty('--input-container-height', `${newHeight + 40}px`);
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [input, isTyping, handleResize]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.plus-icon-button')) {
        setShowList(false);
      }
    };

    if (showList) {
      window.addEventListener('click', handleClickOutside);
    } else {
      window.removeEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showList]);

  const handlePlusIconClick = () => {
    setShowList((prev) => !prev);
  };

  return (
    <div className="complete-wrapper w-full h-full flex flex-col items-center px-0 pt-0">
      {/* Context Wrapper */}
      <div
        className="context-wrapper w-full h-full flex flex-row items-center p-1 pt-0 gap-2"
        style={{
          height: 'var(--input-container-height, 35px)',
        }}
      >
        <div className="flex items-center gap-1 relative">
          <VSCodeButton
            onClick={handlePlusIconClick}
            appearance="icon"
            aria-label="Attach Image"
            disabled={isTyping}
            className="flex items-center justify-center rounded-none p-0 h-4 w-4 plus-icon-button"
          >
            <span className="codicon codicon-add text-xs"></span>
          </VSCodeButton>
          {showList && (
            <div
              className="absolute bottom-full left-0 mb-2 w-56 border rounded shadow-md z-10 p-0 dropdown-container"
              style={{
                backgroundColor: 'var(--vscode-editor-background)',
                borderColor: 'var(--vscode-editorGroup-border)',
                color: 'var(--vscode-editor-foreground)',
                overflow: 'hidden',
              }}
            >
              {openEditorFilesList.length > 0 ? (
                openEditorFilesList.map((file) => (
                  <div
                    key={file.filePath}
                    onClick={() =>
                      handleListItemClickFunction(
                        file,
                        setSelectedItem,
                        setShowList,
                        attachedContext,
                        openEditorFilesList,
                        setOpenEditorFilesList,
                        setAttachedContext,
                        vscode
                      )
                    }
                    className="p-1 cursor-pointer rounded-sm overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--vscode-editor-background)',
                      borderColor: 'var(--vscode-editorGroup-border)',
                      color: 'var(--vscode-editor-foreground)',
                    }}
                    title={file.filePath}
                  >
                    {file.filePath.length > 30
                      ? `${file.filePath.slice(0, 7)}...${file.filePath.slice(-23)}`
                      : file.filePath}
                  </div>
                ))
              ) : (
                <div className="p-1 text-center" style={{ color: 'var(--vscode-editor-foreground)' }}>
                  No opened editors
                </div>
              )}
            </div>
          )}
          {attachedContext.length > 0 ? (
            attachedContext.map((context, index) =>
              context.fileName && context.filePath ? (
                <span
                  key={index}
                  className="rounded-sm px-1 flex items-center h-5 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--vscode-editor-background)',
                    borderColor: 'var(--vscode-editorGroup-border)',
                    color: 'var(--vscode-editor-foreground)',
                    position: 'relative',
                  }}
                >
                  {context.isSelected && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'green',
                        borderRadius: '50%',
                        display: 'inline-block',
                        marginRight: '4px',
                      }}
                    ></span>
                  )}
                  {context.isManuallyAddedByUser && (
                    <span
                      className="codicon codicon-bookmark"
                      style={{ marginRight: '4px', fontSize: '12px' }}
                    ></span>
                  )}

                  {context.fileName}
                  <VSCodeButton
                    appearance="icon"
                    aria-label="Remove Context"
                    className="mr-1 p-0 rounded-none h-3 w-3"
                    onClick={() =>
                      handleRemoveTagFunction(
                        context.filePath,
                        attachedContext,
                        setAttachedContext,
                        openEditorFilesList,
                        setOpenEditorFilesList
                      )
                    }
                  >
                    <span className="codicon codicon-close text-xxs"></span>
                  </VSCodeButton>
                </span>
              ) : null
            )
          ) : (
            <span
              className="rounded-sm px-1 flex items-center h-5 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                backgroundColor: 'var(--vscode-editor-background)',
                borderColor: 'var(--vscode-editorGroup-border)',
                color: 'var(--vscode-editor-foreground)',
              }}
            >
              No file selected
            </span>
          )}
        </div>
      </div>

      {/* Chat Wrapper */}
      <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-0">
        <div
          className="input-container flex flex-col gap-0 w-full max-w-2xl p-0 border rounded-sm"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          {/* Textarea */}
          <div className="top-section flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleResize();
              }}
              placeholder="Type your message..."
              className="flex-grow bg-transparent outline-none p-2 resize-none input-textarea text-sm"
              style={{
                color: 'var(--vscode-editor-foreground)',
                minHeight: '1.3em',
                backgroundColor: 'transparent',
              }}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
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
                }
              }}
            />
          </div>

          {/* Bottom Section */}
          <div
            className="bottom-section flex justify-between items-center gap-2 mt-0 p-0"
            style={{
              borderTop: `1px solid var(--vscode-editorGroup-border)`,
            }}
          >
            {/* Chat Model Dropdown */}
            <VSCodeDropdown
              className="rounded-md p-0 outline-none text-sm"
              style={{
                backgroundColor: 'var(--vscode-editor-background)',
                color: 'var(--vscode-editor-foreground)',
                borderColor: 'var(--vscode-editorGroup-border)',
              }}
              value={chatModel}
              onChange={(e) => {
                if (e.target) {
                  setChatModel((e.target as HTMLSelectElement).value);
                }
              }}
            >
              <VSCodeOption value="neo-1">Neo-Basic</VSCodeOption>
              <VSCodeOption value="neo-7">Neo-Expert</VSCodeOption>
            </VSCodeDropdown>

            {/* Buttons */}
            <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
              <VSCodeButton
                onClick={() => handleCodeInsertClickFunction(vscode)}
                appearance="icon"
                aria-label="Attach Image"
                disabled={isTyping}
                className="rounded-none"
                style={{
                  color: 'var(--vscode-button-foreground)',
                }}
              >
                <span className="codicon codicon-file-media"></span>
              </VSCodeButton>

              {isTyping ? (
                <VSCodeButton
                  onClick={() => handleStopClickFunction(setIsTyping, setIsInterrupted)}
                  appearance="icon"
                  aria-label="Stop"
                  className="rounded-none"
                  style={{
                    color: 'var(--vscode-button-foreground)',
                  }}
                >
                  <span className="codicon codicon-debug-stop"></span>
                </VSCodeButton>
              ) : (
                <VSCodeButton
                  onClick={() =>
                    handleSendClick(
                      isTyping,
                      setWarningMessage,
                      setIsInterrupted,
                      sanitizeInput,
                      input,
                      setInput,
                      handleSendMessage,
                      setIsTyping
                    )
                  }
                  appearance="icon"
                  aria-label="Send Message"
                  disabled={isTyping}
                  className="rounded-none"
                  style={{
                    color: 'var(--vscode-button-foreground)',
                  }}
                >
                  <span className="codicon codicon-send"></span>
                </VSCodeButton>
              )}
            </div>
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
