// ChatControls.tsx
import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { Send,CircleStop,Paperclip } from "lucide-react";
import {
  handleCodeInsertClickFunction,
  handleStopClickFunction,
  handleSendClick,
  sanitizeInput,
} from '../../hooks/InputBarUtils';
import { useVscode } from '../../context/VscodeContext';

interface ChatControlsProps {
  input: string;
  setInput: (val: string) => void;
  warningMessage: string;
  setWarningMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const ChatControls: React.FC<ChatControlsProps> = ({
  input,
  setInput,
  setWarningMessage,
  handleSendMessage,
  isTyping,
}) => {
  const {setIsTyping, setIsInterrupted } = useChatContext();
  const vscode = useVscode();


  return (
    <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
      <VSCodeButton
        onClick={() => handleCodeInsertClickFunction(vscode)}
        appearance="icon"
        aria-label="Attach Image"
        disabled={isTyping}
        className="rounded-md"
        style={{
          color: 'var(--vscode-button-foreground)',
        }}
      >
        <span><Paperclip size={14}/></span>
      </VSCodeButton>

      {isTyping ? (
        <VSCodeButton
          onClick={() => handleStopClickFunction(setIsTyping, setIsInterrupted)}
          appearance="icon"
          aria-label="Stop"
          className="rounded-md text-red-500"
        >
          <span><CircleStop size={14}/></span>
        </VSCodeButton>
      ) : (
        <VSCodeButton
          onClick={() => {
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
          }}
          appearance="icon"
          aria-label="Send Message"
          disabled={isTyping}
          className="rounded-md text-green-500"
        >
          <span><Send size={14}/></span>
        </VSCodeButton>
      )}
    </div>
  );
};

export default ChatControls;
