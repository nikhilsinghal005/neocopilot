// UploadedFileTags.tsx
import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import {X,Image} from "lucide-react";
import {handleRemoveImage  } from '../../../features/chat/hooks/InputBarUtils';
import { UploadedImage } from '../../../shared/types/Message';

const UploadedFileTags: React.FC = () => {
  const {
    uploadImage,
    setUploadImage,
    isEditing,
  } = useChatContext();

  if (uploadImage.length === 0) {
    return (
      <></>
    );
  }

  return (
    <>
      {uploadImage.map((context: UploadedImage, index: number) =>
        context.fileName && context.filePath ? (
          <span
            key={index}
            className="rounded-xs px-1 flex items-center justify-center h-5 text-xxs max-w-xs overflow-hidden text-ellipsis whitespace-nowrap mr-1"
            style={{
              backgroundColor: 'var(--vscode-diffEditor-unchangedRegionBackground)',
              color: 'var(--vscode-button-foreground)',
              position: 'relative',
            }}
          >
            {context.isManuallyAddedByUser && (
              <span
                className="codicon codicon-bookmark ml-1"
                style={{ marginRight: '2px', fontSize: '8px' }}
              ></span>
            )}
            <span className="flex items-center min-w-0">
              <Image size={12} className="mr-1 ml-1 flex-shrink-0" />
              <span className="truncate text-ellipsis overflow-hidden" style={{ fontSize: '10px', minWidth: '50px' }}>
                {context.fileName}
              </span>
            </span>
            {!isEditing ? (
            <VSCodeButton
              appearance="icon"
              aria-label="Remove Context"
              className="mt-1 mr-1 rounded-md h-3 w-3 hover:bg-transparent"
              onClick={() =>
                handleRemoveImage(
                  context.filePath,
                  uploadImage,
                  setUploadImage,
                )
              }
            >
              <span className="mr-1"><X size={12}/></span>
            </VSCodeButton>
            ) : null}
          </span>
        ) : null
      )}
    </>
  );
};

export default UploadedFileTags;
