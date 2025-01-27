// ContextWrapper.tsx
import React, { useState, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { CirclePlus } from "lucide-react";
import FileListDropdown from './FileListDropdown';
import SelectedContextTags from './SelectedContextTags';

interface ContextWrapperProps {
  isTyping: boolean;
  isEditing: boolean;
}

const ContextWrapper: React.FC<ContextWrapperProps> = () => {
  const { isTyping, isEditing } = useChatContext();
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

    if (showList) {
      window.addEventListener('click', handleClickOutside);
    } else {
      window.removeEventListener('click', handleClickOutside);
    }

    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showList]);

  const handlePlusIconClick = () => {
    setShowList((prev) => !prev);
  };

  return (
    <div
      className="context-wrapper w-full flex flex-row items-center p-1 pt-0 mt-2"
      style={{
        height: '20px',
      }}
    >
      <div className="flex items-center gap-1 relative">
        <VSCodeButton
          onClick={handlePlusIconClick}
          appearance="icon"
          aria-label="Attach Context"
          disabled={isTyping}
          className="flex items-center justify-center rounded-md plus-icon-button"
        >
          <span><CirclePlus size={14}/></span>
        </VSCodeButton>

        {showList && (
          <div
            className={`absolute ${isEditing ? 'top-full' : 'bottom-full'} left-0 mb-2 w-64 rounded-md shadow-md z-10 p-0 dropdown-container`}
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
  );
};

export default ContextWrapper;
