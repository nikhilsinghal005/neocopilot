import React from 'react';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';
import { handleAttachItemClickFunction } from '../../hooks/InputBarUtils';
import { useVscode } from '../../context/VscodeContext';

interface AttachFileListDropdownProps {
    onFileSelect?: (file: any) => void;
    handleKeyDown?: (e: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>) => void;
  }
  
const AttachFileListDropdown: React.FC<AttachFileListDropdownProps> = ({ onFileSelect, handleKeyDown }) => {
  const {
    openEditorFilesList,
    attachedContext,
    setAttachedContext,
    setOpenEditorFilesList,
  } = useChatContext();
  const vscode = useVscode();

  const [searchQuery, setSearchQuery] = React.useState('');
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
    console.log(attachedContext);
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
    <div className="flex flex-col">
      <div className="flex-1 overflow-auto">
        {filteredFiles.map((file: any) => (
          <div
            key={file.filePath}
            onClick={() => handleListItemClick(file)}
            onKeyDown={handleKeyDown}
            className="p-1 cursor-pointer rounded-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2 border-b"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              color: 'var(--vscode-editor-foreground)',
              transition: 'background-color 0.2s ease-in-out',
              borderColor: 'var(--vscode-editorGroup-border)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--vscode-button-background)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--vscode-button-foreground)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor =
                'var(--vscode-editor-background)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--vscode-editor-foreground)';
            }}
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