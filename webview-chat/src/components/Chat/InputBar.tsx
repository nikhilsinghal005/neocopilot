import React, { useState } from 'react';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';

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
      <div className="input-container flex flex-col gap-0 z-10 p-1 bg-vscode-editor-foreground h-full justify-center">
        {/* Text Area */}
        <div className="additional-items flex items-center gap-2">
          {/* Add future buttons or elements here */}
        </div>
        <VSCodeTextArea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); // Prevent adding a new line
              handleClick();
            }
          }}
          className="w-full"
          // style={{
          //   minHeight: '52px', // Set a minimum height
          //   backgroundColor: '#1e1e1e', // Set to match input background
          //   resize: 'none', // Remove resize handle
          //   borderRadius: '0px' // Add or adjust border radius
          // } as React.CSSProperties}
        />

        {/* Send Button */}
        <div className="flex justify-end bg-[#1e1e1e] p-0"> {/* Adjusted to match text area styling */}
          <VSCodeButton
            onClick={handleClick}
            appearance="icon"
            aria-label="Send Message"
            disabled={isTyping}
            className="text-white rounded-none" 
          >
            <span className="codicon codicon-send"></span>
          </VSCodeButton>
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
