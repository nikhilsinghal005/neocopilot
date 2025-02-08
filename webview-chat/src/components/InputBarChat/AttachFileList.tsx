import React, { useState } from 'react';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';
import { handleAttachItemClickFunction } from '../../hooks/InputBarUtils';
import { useVscode } from '../../context/VscodeContext';

interface AttachFileListDropdownProps {
  onFileSelect?: (file: any) => void;
  handleKeyDown?: (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => void;
}

const AttachFileListDropdown: React.FC<AttachFileListDropdownProps> = ({ 
  onFileSelect, 
  handleKeyDown 
}) => {
  const {
    openEditorFilesList,
    attachedContext,
    setAttachedContext,
    setOpenEditorFilesList,
  } = useChatContext();
  const vscode = useVscode();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFiles = openEditorFilesList.filter((file: any) =>
    file.filePath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleListItemClick = (file: any) => {
    handleAttachItemClickFunction(
      file,
      () => {}, 
      () => {},
      attachedContext,
      openEditorFilesList,
      setOpenEditorFilesList,
      setAttachedContext,
      vscode
    );
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleInternalKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredFiles.length);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFiles.length) % filteredFiles.length);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (filteredFiles[selectedIndex]) {
          handleListItemClick(filteredFiles[selectedIndex]);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        handleKeyDown?.(e);
        break;
      }
      default: {
        handleKeyDown?.(e);
      }
    }
  };

  if (openEditorFilesList.length === 0) {
    return (
      <div
        className="p-1 text-center text-xxs"
        style={{ color: 'var(--vscode-editor-foreground)' }}
      >
        No opened editors
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col"
      onKeyDown={handleInternalKeyDown}
    >
      <div className="flex-1 overflow-auto">
        {filteredFiles.map((file: any, index) => (
          <div
            key={file.filePath}
            onClick={() => handleListItemClick(file)}
            className="p-1 cursor-pointer rounded-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2 border-b"
            style={{
              backgroundColor: selectedIndex === index ? 
                'var(--vscode-list-activeSelectionBackground)' : 
                'var(--vscode-editor-background)',
              color: 'var(--vscode-editor-foreground)',
              borderColor: 'var(--vscode-editorGroup-border)',
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            title={file.filePath}
          >
            <LanguageIcon fileName={file.fileName || ''} iconSize={20} />
            <span className="text-xxs">
              {file.filePath.length > 30
                ? `${file.filePath.slice(0, 7)}...${file.filePath.slice(-23)}`
                : file.filePath}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachFileListDropdown;