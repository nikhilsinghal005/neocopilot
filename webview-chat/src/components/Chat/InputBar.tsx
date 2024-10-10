import React from 'react';
import { VSCodeButton, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage }) => {
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
              handleSendMessage();
            }
          }}
          className="flex-grow" // New Tailwind class to manage width
          style={{
            height: 'var(--input-height)',
            '--input-height': '52',
          } as any}
        >
          {/* Button placed in the slot="end" */}
          <section slot="end" style={{ display: 'flex', alignItems: 'center' }}>
            <VSCodeButton
              onClick={handleSendMessage}
              appearance="icon"
              aria-label="Send Message"
            >
              <span className="codicon codicon-send"></span>
            </VSCodeButton>
          </section>
        </VSCodeTextField>
        {/* Placeholder for buttons or icons on the right */}
        <div className="additional-items flex items-center gap-2">
          {/* Add future buttons or elements here */}
        </div>
      </div>
    </div>
  );
};

export default InputBar;
