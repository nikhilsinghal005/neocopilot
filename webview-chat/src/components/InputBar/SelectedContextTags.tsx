// SelectedContextTags.tsx
import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';
import { handleRemoveTagFunction } from '../../hooks/InputBarUtils';

const SelectedContextTags: React.FC = () => {
  const {
    attachedContext,
    setAttachedContext,
    openEditorFilesList,
    setOpenEditorFilesList,
  } = useChatContext();

  if (attachedContext.length === 0) {
    return (
      <span
        className="rounded-xs px-1 flex items-center h-6 text-xs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          color: 'var(--vscode-editor-foreground)',
        }}
      >
        No file selected
      </span>
    );
  }

  return (
    <>
      {attachedContext.map((context: any, index: number) =>
        context.fileName && context.filePath ? (
          <span
            key={index}
            className="rounded-xs pr-1 flex items-center h-6 text-xs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              borderColor: 'var(--vscode-editorGroup-border)',
              color: 'var(--vscode-editor-foreground)',
              position: 'relative',
            }}
          >
            {context.isSelected && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'green',
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginRight: '2px',
                  marginLeft: '3px',
                }}
              ></span>
            )}
            {context.isManuallyAddedByUser && (
              <span
                className="codicon codicon-bookmark"
                style={{ marginRight: '2px', fontSize: '12px' }}
              ></span>
            )}
            <LanguageIcon fileName={context.fileName || ''} iconSize={20} />
            {context.fileName}
            <VSCodeButton
              appearance="icon"
              aria-label="Remove Context"
              className="mr-1 p-0 rounded-none h-3 w-3"
              onClick={() =>
                handleRemoveTagFunction(
                  context.filePath,
                  attachedContext,
                  setAttachedContext,
                  openEditorFilesList,
                  setOpenEditorFilesList
                )
              }
            >
              <span className="codicon codicon-close text-xxs"></span>
            </VSCodeButton>
          </span>
        ) : null
      )}
    </>
  );
};

export default SelectedContextTags;
