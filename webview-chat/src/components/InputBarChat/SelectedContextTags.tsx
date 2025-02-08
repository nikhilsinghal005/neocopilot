// SelectedContextTags.tsx
import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';
import {X} from "lucide-react";
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
        className="rounded-xs px-1 flex items-center justify-center h-5 text-xxs max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
        style={{
          backgroundColor: 'var(--vscode-diffEditor-unchangedRegionBackground)',
          color: 'var(--vscode-button-foreground)',
          fontSize:"10px"
        }}
      >
        No file selected
      </span>
    );
  }

  return (
    <>
      {attachedContext.map((context: CurrentFileContext, index: number) => (
        <span
          key={index}
          className="rounded-xs px-1 flex items-center justify-center h-5 text-xxs max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
          style={{
            backgroundColor: 'var(--vscode-diffEditor-unchangedRegionBackground)',
            color: 'var(--vscode-button-foreground)',
            position: 'relative',
          }}
        >
          {context.isSelected && (
            <span
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'green',
                borderRadius: '50%',
                display: 'inline-block',
                marginRight: '2px',
                marginLeft: '3px',
              }}
              className="ml-1"
            ></span>
          )}
          {context.isManuallyAddedByUser && (
            <span
              className="codicon codicon-bookmark ml-1"
              style={{ marginRight: '2px', fontSize: '8px' }}
            ></span>
          )}
          {context.isAttachedInText && (
            <span
              style={{ marginRight: '2px', fontSize: '8px' }}
              className="ml-1"
            >@</span>
          )}
          <span className="flex items-center">
            <LanguageIcon fileName={context.fileName || ''} iconSize={16} />
            <span style={{ fontSize: "10px" }}>
              {context.FunctionAttached ? (
                <>
                  {context.fileName} (Line {context.FunctionAttached.range.startLine} – Line {context.FunctionAttached.range.endLine})
                </>
              ) : (
                context.fileName
              )}

            </span>

          </span>

          <VSCodeButton
            appearance="icon"
            aria-label="Remove Context"
            className="mt-1 mr-1 rounded-md h-3 w-3 hover:bg-transparent"
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
            <span className="mr-1"><X size={12} /></span>
          </VSCodeButton>
        </span>
      ))}
    </>
  );
};

export default SelectedContextTags;
