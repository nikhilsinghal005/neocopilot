// FileListDropdown.tsx
import React, {useState} from 'react';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';
import { handleListItemClickFunction } from '../../hooks/InputBarUtils';
import { useVscode } from '../../context/VscodeContext';

const FileListDropdown: React.FC = () => {
  const {
    openEditorFilesList,
    attachedContext,
    setAttachedContext,
    setOpenEditorFilesList,
  } = useChatContext();
  const vscode = useVscode();
  const [showList, setShowList] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Click handler function
  const handleListItemClick = (file: any) => {
    // `any` used here as a fallback if you aren't using a typed object.
    // Otherwise, if you know the shape of `file`, you can still define an interface or inline type
    handleListItemClickFunction(
      file,
      setSelectedItem,
      setShowList,
      attachedContext,
      openEditorFilesList,
      setOpenEditorFilesList,
      setAttachedContext,
      vscode
    );
  };

  if (openEditorFilesList.length === 0) {
    return (
      <div
        className="p-1 text-center"
        style={{ color: 'var(--vscode-editor-foreground)' }}
      >
        No opened editors
      </div>
    );
  }

  return (
    <>
      {openEditorFilesList.map((file: any) => (
        <div
          key={file.filePath}
          onClick={() => handleListItemClick(file)}
          className="p-1 cursor-pointer rounded-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            color: 'var(--vscode-editor-foreground)',
            transition: 'background-color 0.2s ease-in-out',
            border: '1px solid var(--vscode-editorGroup-border)',
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
          <span>
            {file.filePath.length > 30
              ? `${file.filePath.slice(0, 7)}...${file.filePath.slice(-23)}`
              : file.filePath}
          </span>
        </div>
      ))}
    </>
  );
};

export default FileListDropdown;
