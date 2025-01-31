// ContextWrapper.tsx
import React, { useState, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { CirclePlus } from "lucide-react";
import FileListDropdown from './FileListDropdown';
import SelectedContextTags from './SelectedContextTags';
import UploadedFileTags from './UploadedFileTags';

interface ContextWrapperProps {
  isTyping: boolean;
  isEditing: boolean;
}

const ContextWrapper: React.FC<ContextWrapperProps> = () => {
  const { isTyping, isEditing,attachedContext,uploadImage  } = useChatContext();
  const [showList, setShowList] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.dropdown-container') &&
        !target.closest('.plus-icon-button')
      ) {
        setShowList(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowList(false);
      }
    };

    if (showList) {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('keydown', handleEscape);
    } else {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showList]);

  const handlePlusIconClick = () => {
    setShowList((prev) => !prev);
  };

  return (
    <div>
    <div
      className="context-wrapper w-full flex flex-row items-center px-1 my-1 mb-1"
      style={{
        height: '18px',
      }}
    >
      <div className="flex items-center gap-1 relative">
        <VSCodeButton
          onClick={handlePlusIconClick}
          appearance="icon"
          aria-label="Attach Context"
          disabled={isTyping}
          className="flex items-center justify-center rounded-xs plus-icon-button"
        >
          <span><CirclePlus size={14}/></span>
        </VSCodeButton>

        {showList && (
          <div
            className={`absolute ${isEditing ? 'top-full' : 'bottom-full'} left-0 mb-2 w-64 rounded-xs shadow-md z-10 p-0 dropdown-container`}
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              color: 'var(--vscode-editor-foreground)',
              overflow: 'hidden',
              border: '1px solid var(--vscode-editorGroup-border)',
            }}
          >
            <FileListDropdown />
          </div>
        )}

        <SelectedContextTags />
      </div>
    </div>
    {uploadImage.length > 0 &&(
        <div className="context-wrapper w-full flex flex-row items-center px-1 my-1" style={{ height: '18px' }}>
          <UploadedFileTags />
        </div>
      )}
  </div>
  );
};

export default ContextWrapper;
