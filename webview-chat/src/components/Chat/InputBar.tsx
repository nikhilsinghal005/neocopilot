import React from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
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
          placeholder={isTyping ? 'Please wait for the response...' : 'Type your message...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isTyping) {
              handleSendMessage();
            }
          }}
          className="flex-grow"
          style={{
            height: 'var(--input-height)',
            '--input-height': '52',
          } as any}
          disabled={isTyping} // Disable the input field when isTyping is true
        >
          <section slot="end" style={{ display: 'flex', alignItems: 'center' }}>
            <VSCodeButton
              onClick={handleSendMessage}
              appearance="icon"
              aria-label="Send Message"
              disabled={isTyping} // Disable the send button when isTyping is true
            >
              <span className="codicon codicon-send"></span>
            </VSCodeButton>
          </section>
        </VSCodeTextField>
        <div className="additional-items flex items-center gap-2">
          {/* Add future buttons or elements here */}
        </div>
      </div>
    </div>
  );
};

export default InputBar;
