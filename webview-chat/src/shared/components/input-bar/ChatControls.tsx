// ChatControls.tsx
import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import { Send,CircleStop,Paperclip, XCircle } from "lucide-react";
import {
  handleStopClickFunction,
  handleSendClick,
  sanitizeInput,
  handleImageUpload
} from '../../../features/chat/hooks/InputBarUtils';
import { useVscode } from '../../../integration/vscode/api';
import AgentTypeDropdown from './AgentTypeDropdown';

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
  const {setIsTyping, setIsInterrupted, isEditing, setIsEditing,
    previousAgentType,
    setAgentType,
    previousInput,
    chatSession,
  uploadImage, setUploadImage, previousUploadImage
  } = useChatContext();
  const vscode = useVscode();

const handleCancelClick = () => {
  setIsEditing(false);
  setIsTyping(false);
  setInput(previousInput);
  setAgentType(previousAgentType);
  setUploadImage(previousUploadImage);
}


  return (
    <div className="flex justify-between items-center w-full">
      <div className="w-32">
        <AgentTypeDropdown />
      </div>
      <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
        {isEditing && (
          <VSCodeButton
            onClick={() => handleCancelClick()}
            appearance="icon"
            aria-label="Stop"
            className="rounded-md text-yellow-500"
          >
            <span><XCircle size={14}/></span>
          </VSCodeButton>
        )
        }
        
        <VSCodeButton
          onClick={() => handleImageUpload(
            vscode,
            uploadImage,
            setUploadImage,
            chatSession.chatId,
          )}
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
              if (input.trim() === "") {
                return;
              }
              setUploadImage([]);
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
            disabled={isTyping || input.trim() === ""}
            className="rounded-md text-green-500"
          >
            <span><Send size={14}/></span>
          </VSCodeButton>
        )}
      </div>
    </div>
  );
};

export default ChatControls;
