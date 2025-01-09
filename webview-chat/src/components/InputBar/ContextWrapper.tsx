// ContextWrapper.tsx
import React, { useState, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import FileListDropdown from './FileListDropdown';
import SelectedContextTags from './SelectedContextTags';

interface ContextWrapperProps {
  isTyping: boolean;
}

const ContextWrapper: React.FC<ContextWrapperProps> = ({ isTyping }) => {
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
      className="context-wrapper w-full h-full flex flex-row items-center p-1 pt-0 gap-2"
      style={{
        height: 'var(--input-container-height, 35px)',
      }}
    >
      <div className="flex items-center gap-1 relative">
        <VSCodeButton
          onClick={handlePlusIconClick}
          appearance="icon"
          aria-label="Attach Image"
          disabled={isTyping}
          className="flex items-center justify-center rounded-none p-0 h-4 w-4 plus-icon-button"
        >
          <span className="codicon codicon-add text-xs"></span>
        </VSCodeButton>

        {showList && (
          <div
            className="absolute bottom-full left-0 mb-2 w-64 rounded-xs shadow-xs z-10 p-0 dropdown-container"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              color: 'var(--vscode-editor-foreground)',
              overflow: 'hidden',
              border: '3px solid var(--vscode-editorGroup-border)',
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
