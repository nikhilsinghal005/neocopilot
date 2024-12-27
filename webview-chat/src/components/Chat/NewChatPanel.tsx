import React from 'react';
import ReactMarkdown from 'react-markdown';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useVscode } from '../../context/VscodeContext';
import { useChatContext } from '../../context/ChatContext';

const NewChatPanel: React.FC = () => {
  const vscode = useVscode();
  const { chatSessionList, setChatSession } = useChatContext();
  const markdownContent = `
# Welcome to Neo Copilot

Start a new conversation by typing your message below, or click refresh to start a new session. For your privacy, no messages are saved or stored.

Neo Copilot is here to help you write better code, faster.
`;

  // Toggle Webview action handler
  const handleToggleWebview = () => {
    vscode.postMessage({
      command: 'toggle_webview',
      message: 'Toggling the webview.',
    });
  };

  const handleChatClick = (session: any) => {
    setChatSession(session);
  };

  return (
    <div
      className="w-full font-roboto h-full flex flex-col justify-start items-center"
      style={{ paddingTop: '40px' }}
    >
      <div
        className="card border font-roboto rounded-xs shadow-xl p-6 overflow-hidden"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
          maxWidth: '450px',
          minWidth: '400px',
          width: '100%',
        }}
      >
        <ReactMarkdown
          children={markdownContent}
          components={{
            h1: ({ node, ...props }) => (
              <div
                className="text-xl font-roboto  mb-6"
                {...props}
                style={{ color: 'var(--vscode-editor-foreground)' }}
              />
            ),
            p: ({ node, ...props }) => (
              <p
                className="text-sm font-roboto mb-4"
                {...props}
                style={{ color: 'var(--vscode-editor-foreground)' }}
              />
            ),
          }}
        />

        <VSCodeButton
          className="toggle-webview-button w-full h-9 text-base mt-4"
          onClick={handleToggleWebview}
        >
          Toggle Chat Panel
        </VSCodeButton>
      </div>
      {/* {chatSessionList.length > 0 && (
        <div
          className="card border rounded-xs shadow-xl p-6 overflow-hidden mt-4"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
            maxWidth: '450px',
            minWidth: '400px',
            width: '100%',
          }}
        >
          <h2 className="text-sm font-roboto-bold mb-4">Previous Chats</h2>
          <ul className="list-none p-0">
            {chatSessionList.slice(0, 5).map((session, index) => (
              <li
                key={index}
                className="mb-2 p-2 rounded border cursor-pointer"
                style={{
                  borderColor: 'var(--vscode-editorGroup-border)',
                  backgroundColor: 'var(--vscode-sideBar-background)',
                  color: 'var(--vscode-editor-foreground)',
                }}
                onClick={() => handleChatClick(session)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--vscode-list-hoverBackground)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--vscode-sideBar-background)';
                }}
              >
                {session.chatName}
              </li>
            ))}
          </ul>
        </div>
      )} */}
    </div>
  );
};

export default NewChatPanel;
