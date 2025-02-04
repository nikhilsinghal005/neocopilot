// ChatModelDropdown.tsx
import React from "react";
import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { useChatContext } from "../../context/ChatContext";
import { chatModelDetail } from "../../types/AppDetails";

const ChatModelDropdown: React.FC = () => {
  const { chatModel, setChatModel, chatModelList, setChatModelList, isTyping } =
    useChatContext();

  React.useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.command === "update_chat_details") {
        const { model_details } = event.data;
        if (model_details) {
          setChatModelList(model_details);
          const defaultBaseModel = chatModelList.find(
            (model: chatModelDetail) => model.isBaseModel
          );
          if (defaultBaseModel) {
            setChatModel(defaultBaseModel.modelKey);
          }
        }
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [setChatModelList, chatModelList, setChatModel]);

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
