// webview-chat/src/components/Chat/InputBar.tsx
import React, { useState } from 'react';
import { VSCodeButton, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
// import xss from 'xss';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage }) => {
  const [warningMessage, setWarningMessage] = useState('');
  const { isTyping } = useChatContext();

  // Utility function to sanitize input to prevent code execution
  const sanitizeInput = (input: string): string => {
    // Encode special HTML characters to prevent code execution
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
    // console.log(sanitizedInput)
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
              e.preventDefault();
              handleClick();
            }
          }}
          className="w-full"
        />

        {/* Send Button */}
        <div className="flex justify-end bg-[#1e1e1e] p-0">
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