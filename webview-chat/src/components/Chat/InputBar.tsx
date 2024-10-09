import React from 'react';
import { VSCodeButton, VSCodeTextField, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage }) => {
  return (
    <div className="chat-wrapper relative w-full h-full">
      <div className="input-container fixed bottom-0 left-0 right-0 flex items-center gap-2 z-10 p-0 bg-[#1e1e1e]">
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
          style={{
            width: '100%',
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
      </div>
    </div>
  );
};

export default InputBar;
