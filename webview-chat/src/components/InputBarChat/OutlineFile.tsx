import React, { useEffect, useState } from 'react';
import { useVscode } from '../../context/VscodeContext';
import { handleGetOutline, handleFunctionSelect } from '../../hooks/InputBarUtils';
import { FunctionOutline, CurrentFileContext } from '../../types/Message';
import { useChatContext } from '../../context/ChatContext';

interface FunctionListDropdownProps {
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClose: () => void;
  onFunctionSelect?: (func: FunctionOutline) => void;
}

const FunctionListDropdown: React.FC<FunctionListDropdownProps> = ({
  handleKeyDown,
  textareaRef,
  value,
  onChange,
  onClose,
  onFunctionSelect,
}) => {
  const vscode = useVscode();
  const [functions, setFunctions] = useState<FunctionOutline[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { attachedContext, setAttachedContext } = useChatContext();

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        const outlineFunctions = await handleGetOutline(vscode);
        setFunctions(outlineFunctions);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch functions');
        setLoading(false);
      }
    };

    fetchFunctions();
  }, [vscode]);

  const filteredFunctions = functions.filter(func =>
    func.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInternalKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredFunctions.length);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredFunctions.length) % filteredFunctions.length);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (filteredFunctions[selectedIndex]) {
          handleListItemClick(filteredFunctions[selectedIndex]);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onClose();
        break;
      }
      default: {
        handleKeyDown?.(e);
      }
    }
  };

  const handleListItemClick = (func: FunctionOutline) => {
    const selectedFile = attachedContext.find(context => context.isSelected);
    if (!selectedFile) {
      vscode.postMessage({
        command: 'showErrorPopup',
        data: {
          title: 'Error',
          message: 'Please select a file first.',
        },
      });
      return;
    }

    handleFunctionSelect(
      func,
      selectedFile,
      textareaRef,
      value,
      onChange,
      attachedContext,
      setAttachedContext,
      () => onClose(),
      () => onClose(),
      vscode
    );
    if (onFunctionSelect) {
      onFunctionSelect(func);
    }
  };

  if (loading) return <div>Loading functions...</div>;
  if (error) return <div>{error}</div>;
  if (functions.length === 0) return <div>No functions found in current file</div>;

  return (
    <div onKeyDown={handleInternalKeyDown}>
      {filteredFunctions.map((func, index) => (
        <div
          key={`${func.name}-${func.range.startLine}`}
          onClick={() => handleListItemClick(func)}
          className="p-1 cursor-pointer rounded-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-2 border-b"
          style={{
            backgroundColor: selectedIndex === index ? 
              'var(--vscode-list-activeSelectionBackground)' : 
              'var(--vscode-editor-background)',
            color: 'var(--vscode-editor-foreground)',
            borderColor: 'var(--vscode-editorGroup-border)',
          }}
          onMouseEnter={() => setSelectedIndex(index)}
          title={`${func.name} (Line ${func.range.startLine + 1})`}
        >
          <span>{func.name}</span>
          <span>
            {func.type} • Line {func.range.startLine + 1}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FunctionListDropdown;