import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTag } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { useVscode } from '../../context/VscodeContext';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
  const [warningMessage, setWarningMessage] = useState('');
  const { isTyping: contextIsTyping } = useChatContext();
  const vscode = useVscode();

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'insert_messages') {
        console.log('Received chat message from VS Code:', event.data);
        setInput(event.data.inputText || '');
      }
    };

    window.addEventListener('message', handleIncomingMessage);

    return () => {
      window.removeEventListener('message', handleIncomingMessage);
    };
  }, [setInput]);

  // Function to sanitize input to prevent code execution
  const sanitizeInput = (input: string): string => {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const handleClick = () => {
    if (isTyping) {
      setWarningMessage('Please wait, the assistant is still responding.');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    const sanitizedInput = sanitizeInput(input);
    setInput(sanitizedInput);
    handleSendMessage();
  };

  const handleCodeInsertClick = () => {
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        "title": "Insert Code",
        "message": "Neo is currently developing this feature and it will be available shortly."
      },
    });
  };

  const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to calculate the scroll height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 70), 150); // Keep within min/max
      textarea.style.height = `${newHeight}px`;

      // Update the CSS variable for `input-container`
      document.documentElement.style.setProperty('--input-container-height', `${newHeight + 40}px`); // Adding padding/margin as needed
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [input, isTyping, handleResize]);

  return (
    <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-1">
      {/* Input Container */}
      <div 
        className="input-container flex flex-col gap-0 w-full max-w-2xl p-0 border rounded-sm"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
        }}
      >
        {/* Top Section: Text Input */}
        <div className="top-section flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleResize();
            }}
            placeholder="Type your message..."
            //"Ask anything, '/' for commands, '@' to add context"
            className="flex-grow bg-transparent outline-none p-2 resize-none input-textarea"
            style={{
              color: 'var(--vscode-editor-foreground)',
              minHeight: '3.5em', // Adjusts to show approximately 3 lines by default
              backgroundColor: 'transparent', // Ensures background matches the VS Code theme
            }}
            rows={2} // Minimum of 3 rows displayed
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleClick();
              }
            }}
          />
        </div>

        {/* Bottom Section: Dropdown on Left, Buttons on Right */}
        <div className="bottom-section flex justify-between items-center gap-2 mt-0 p-1"
          style={{
            borderTop: `1px solid var(--vscode-editorGroup-border)`,
          }}
        >
          {/* Dropdown Selector on Left */}
          <VSCodeDropdown
            className="rounded-md p-0 outline-none"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              color: 'var(--vscode-editor-foreground)',
              borderColor: 'var(--vscode-editorGroup-border)',
              minWidth: '100px',
            }}
          >
            <VSCodeOption>Neo-Basic</VSCodeOption>
          </VSCodeDropdown>
          {/* <VSCodeTag className="rounded-md p-0 outline-none"> Current File </VSCodeTag> */}
          {/* Right Section: Attachment and Send Buttons */}
          <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
            {/* Attachment Icon Button */}
            <VSCodeButton
              onClick={handleCodeInsertClick}
              appearance="icon"
              aria-label="Attach Image"
              disabled={isTyping}
              className="rounded-none"
              style={{
                color: 'var(--vscode-button-foreground)',
              }}
            >
              <span className="codicon codicon-file-media"></span> {/* Alternative for attachment */}
            </VSCodeButton>

            {/* Send Button */}
            <VSCodeButton
              onClick={handleClick}
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
          </div>
        </div>
      </div>

      {/* Warning message */}
      {warningMessage && (
        <div className="text-sm mt-1" style={{ color: 'var(--vscode-errorForeground)' }}>
          {warningMessage}
        </div>
      )}
    </div>
  );
};

export default InputBar;
