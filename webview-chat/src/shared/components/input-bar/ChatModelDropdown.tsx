// ChatModelDropdown.tsx
import React, { useEffect } from "react";
import {
  VSCodeDropdown,
  VSCodeOption,
} from "@vscode/webview-ui-toolkit/react";
import { useChatContext } from "../../../features/chat/state/chatTypes";
import { chatModelDetail } from "../../types/AppDetails";

const ChatModelDropdown: React.FC = () => {
  const { chatModel, setChatModel, chatModelList, setChatModelList, isTyping } =
    useChatContext();

  useEffect(() => {
    const staticModels: chatModelDetail[] = [
      {
        modelKey: "agent",
        modelName: "Agent",
        modelDescription: "Agent model",
        modelType: "agent",
        modelUsageCountLeft: 0,
        isBaseModel: true,
      },
      {
        modelKey: "ask",
        modelName: "Ask",
        modelDescription: "Ask model",
        modelType: "ask",
        modelUsageCountLeft: 0,
      },
    ];
    setChatModelList(staticModels);
    setChatModel("agent");
  }, [setChatModelList, setChatModel]);

  return (
    <>
    <style>
        {`
          vscode-dropdown::part(control) {
            font-size: 10px; /* Adjust the font size as needed */
            border: none;
            border-radius: 7%;
          }
          vscode-option::part(control) {  
            font-size: 10px; /* Adjust the font size as needed */
            border: none;
            border-radius: 7%;
          }
        `}
      </style>
    <VSCodeDropdown
    className="rounded-md h-5 text-xxs"
    style={{
      backgroundColor: 'transparent',
      border: 'none',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground)';
      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
      e.currentTarget.style.borderRadius = '7%';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
    }}
      value={chatModel}
      disabled={isTyping}
      onChange={(e) => {
        if (e.target) {
          setChatModel((e.target as HTMLSelectElement).value);
        }
      }}
    >
      {chatModelList.map((chatModel) => (
        <VSCodeOption
          key={chatModel.modelKey}
          value={chatModel.modelKey}
          className="text-xxs"
        >
          {chatModel.modelName}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
    </>
  );
};

export default ChatModelDropdown;
