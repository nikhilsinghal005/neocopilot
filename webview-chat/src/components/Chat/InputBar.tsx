import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage }) => {
  return (
    <div className="input-container fixed bottom-4 left-1 right-1 flex items-center gap-2 z-10">
      <div className="relative w-full">
        <input
          type="text"
          className="!overflow-y-auto !min-h-[64px] w-full px-4 pr-40 bg-[#1e1e1e] text-[#f3f3f3] border border-2 border-[#3c3c3c] focus:outline-none focus:ring-2 focus:ring-[#007acc] rounded-md resize-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
        />
        <VSCodeButton
          onClick={handleSendMessage}
          className="absolute bottom-2 right-2 w-10 h-10 p-0 bg-[#2a2a2e] hover:bg-[#3c3f41] focus:ring-2 focus:ring-[#007acc] flex items-center justify-center"
          appearance="icon"
          aria-label="Send Message"
        >
          <span className="codicon codicon-send text-white text-lg"></span>
        </VSCodeButton>
      </div>
    </div>
  );
};

export default InputBar;