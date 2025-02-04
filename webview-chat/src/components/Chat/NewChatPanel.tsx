import React from 'react';
import { useChatContext } from '../../context/ChatContext';
import { Brain, CodeXml, Plug2, BotMessageSquare, MessageSquare } from "lucide-react";

const NewChatPanel: React.FC = () => {
  // const vscode = useVscode();
  const { chatSessionList, setChatSession } = useChatContext();

  // // Toggle Webview action handler
  // const handleToggleWebview = () => {
  //   vscode.postMessage({
  //     command: 'toggle_webview',
  //     message: 'Toggling the webview.',
  //   });
  // };

  const handleChatClick = (session: any) => {
    setChatSession(session);
  };

  return (
    <div
      className="w-full font-roboto h-full flex flex-col justify-start items-center overflow-y-auto px-4"
      style={{ paddingTop: '40px', 
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--vscode-scrollbarSlider-background) transparent',
       }}
    >
      <h1 className="text-lg font-roboto-bold mb-4">Welcome to Neo Copilot</h1>
      <div
        className="grid grid-cols-2 gap-4 w-full"
        style={{
          maxWidth: '600px',
          minWidth: '300px',
          // height: '100%',
        }}
      >
        {/* AI-Inline Edit */}
        <div
          className="card border font-roboto rounded-xs shadow-xl p-4 flex flex-col items-start"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
            fontSize: '14px',
          }}
        >
          <div className="flex items-center mb-2">
            <div className="icon-placeholder mr-2"><Brain size={24} /></div>
            <h1 className="text-md font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
              AI-Inline Edit
            </h1>
          </div>
          <p className="text-sm font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
            Elevate your workflow with AI-powered inline editing, enhancing code quality, reducing errors, and improving productivity.
          </p>
        </div>

        {/* Real-Time Code Suggestions */}
        <div
          className="card border font-roboto rounded-xs shadow-xl p-4 flex flex-col items-start"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          <div className="flex items-center mb-2">
            <div className="icon-placeholder mr-2"><CodeXml size={24} /></div>
            <h1 className="text-md font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
              Real-Time Code Suggestions
            </h1>
          </div>
          <p className="text-sm font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
            Receive instant inline guidance as you type, enabling fast, accurate, and efficient code development.
          </p>
        </div>

        {/* Smart Insert and Context */}
        <div
          className="card border font-roboto rounded-xs shadow-xl p-4 flex flex-col items-start"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          <div className="flex items-center mb-2">
            <div className="icon-placeholder mr-2"><Plug2 size={24} /></div>
            <h1 className="text-md font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
              Smart Insert and Context
            </h1>
          </div>
          <p className="text-sm font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
            Enhance productivity with intelligent features that adapt, insert snippets, and offer project insights.
          </p>
        </div>

        {/* Intelligent Chat */}
        <div
          className="card border font-roboto rounded-xs shadow-xl p-4 flex flex-col items-start"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
          }}
        >
          <div className="flex items-center mb-2">
            <div className="icon-placeholder mr-2"><BotMessageSquare size={24} /></div>
            <h1 className="text-md font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
              Intelligent Chat
            </h1>
          </div>
          <p className="text-sm font-roboto" style={{ color: 'var(--vscode-editor-foreground)', fontSize: '12px' }}>
            Interact with an AI assistant delivering contextual answers, simplifying debugging, and speeding up tasks.
          </p>
        </div>
      </div>

      {chatSessionList.length > 0 && (
        <div
          className="p-4 mt-4 border rounded-md"
          style={{
            maxWidth: '600px',
            minWidth: '300px',
            maxHeight: '150px',
            width: '100%',
            borderColor: 'var(--vscode-editorGroup-border)',
          }}
        >
          <h2 className="text-sm font-roboto-bold mb-2">Previous Chats</h2>
          <ul className="list-none p-0">
            {chatSessionList.slice(0, 7).map((session, index) => (
              <li
                key={index}
                className="mb-2 flex items-center p-2 rounded cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--vscode-editor-foreground)',
                }}
                onClick={() => handleChatClick(session)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--vscode-list-hoverBackground)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="mr-2" style={{ color: 'var(--vscode-editor-foreground)' }}>
                  <MessageSquare size={16} />
                </span>
                <span style={{fontSize:"12px"}}>{session.chatName}</span>
              </li>

            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NewChatPanel;
