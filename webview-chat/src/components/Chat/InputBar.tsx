import React, { useState } from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
  const [warningMessage, setWarningMessage] = useState('');

  const handleClick = () => {
    if (isTyping) {
      // Display a warning message if a message is still being processed
      setWarningMessage('Please wait, the assistant is still responding.');
      setTimeout(() => setWarningMessage(''), 3000); // Clear warning after 3 seconds
      return;
    }
    handleSendMessage();
  };

  return (
    <div className="chat-wrapper relative w-full h-full">
      <div className="input-container flex items-center gap-0 z-10 pl-1 pr-1 bg-vscode-editor-background h-full justify-center">
        <div className="additional-items flex items-center gap-2">
          {/* Add future buttons or elements here */}
        </div>
        <VSCodeTextField
          type="text"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleClick();
            }
          }}
          className="flex-grow"
          style={{
            height: 'var(--input-height)',
            '--input-height': '52',
          } as any}
        >
          <section slot="end" style={{ display: 'flex', alignItems: 'center' }}>
            <VSCodeButton
              onClick={handleClick}
              appearance="icon"
              aria-label="Send Message"
            >
              <span className="codicon codicon-send"></span>
            </VSCodeButton>
          </section>
        </VSCodeTextField>

        <div className="additional-items flex items-center gap-2">
          {/* Add future buttons or elements here */}
        </div>
      </div>
      {/* Warning message displayed below the input field */}
      {warningMessage && (
        <div className="text-red-500 text-sm mt-1">
          {warningMessage}
        </div>
      )}
    </div>
  );
};

export default InputBar;
