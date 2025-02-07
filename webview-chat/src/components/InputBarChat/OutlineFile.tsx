import React, { useEffect, useState } from 'react';
import { useVscode } from '../../context/VscodeContext';
import { handleGetOutline } from '../../hooks/InputBarUtils';
import { FunctionOutline } from '../../types/Message';

interface FunctionListDropdownProps {
  onFunctionSelect: (func: FunctionOutline) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
}

const FunctionListDropdown: React.FC<FunctionListDropdownProps> = ({
  onFunctionSelect,
  handleKeyDown,
}) => {
  const vscode = useVscode();
  const [functions, setFunctions] = useState<FunctionOutline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleListItemClick = (func: FunctionOutline) => {
    onFunctionSelect();
  };

  if (loading) {
    return <div>Loading functions...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (functions.length === 0) {
    return <div>No functions found in current file</div>;
  }

  return (
    <div>
      {filteredFunctions.map((func) => (
        <div
          key={`${func.name}-${func.range.startLine}`}
          onClick={() => handleListItemClick(func)}
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
