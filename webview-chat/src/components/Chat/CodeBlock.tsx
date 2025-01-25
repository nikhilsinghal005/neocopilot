import React, { useState, useEffect } from 'react';
import { useVscode } from '../../context/VscodeContext';
import { VscNewFile, VscAdd, VscClose } from "react-icons/vsc"
import CodeButton from '../Common/CodeButton';
import CodeButtonWithText from '../Common/CodeButtonWithText';
import CodeButtonNormal from '../Common/CodeButtonNormal';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
// import CodeButtonWithName from '../Common/CodeButtonWithName';
import { useChatContext } from '../../context/ChatContext';
import LanguageIcon from '../Common/LanguageIcon';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  codeContent?: React.ReactNode; // Make sure this is optional
  fileName?: string;
  relativePath: string;
  [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  inline,
  className,
  codeContent,
  fileName,
  relativePath,
  ...props
}) => {
  const vscode = useVscode();
  const [state, setState] = useState<'idle' | 'processing' | 'review' | 'newFileRequiredType1' | 'newFileRequiredType2'>('idle');
  const [dots, setDots] = useState('');
  const codeId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []); // Generate unique ID for the code block
  console.log("codeId", codeId)
  const [showNewFileDropdownType1, setShowNewFileDropdownType1] = useState(false);
  const [showNewFileDropdownType2, setShowNewFileDropdownType2] = useState(false);
  const { isTyping } = useChatContext();

  useEffect(() => {
    const handleSmartInsertToEditorUpdate = (event: MessageEvent) => {
      // console.log("smart Insert Call -----------------------------", event.data)
      if (event.data.command === 'smart_insert_to_editor_update' && event.data.codeId === codeId) {
        // console.log('Smart Insert to Editor Update', event.data);
        if (!event.data.isComplete) {
          setState('idle');
        } else {
          setState('review');
        }
      }
    };

    const handleNewFileRequired = (event: MessageEvent) => {
      if (event.data.command === 'file_does_not_exist' && event.data.codeId === codeId) {
        console.log("Check the data recived from the extension", event.data)
        // console.log("File does not exist")
        if (event.data.isAnyFileOpen) {
          setState('newFileRequiredType1');
          setShowNewFileDropdownType1(true);
        } else {
          setState('newFileRequiredType2');
          setShowNewFileDropdownType2(true);
        }
        // Show dropdown when new file is required
      }
    };

    window.addEventListener('message', handleSmartInsertToEditorUpdate);
    window.addEventListener('message', handleNewFileRequired);

    return () => {
      window.removeEventListener('message', handleSmartInsertToEditorUpdate);
      window.removeEventListener('message', handleNewFileRequired);
    };
  }, [codeId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'processing') {
      interval = setInterval(() => {
        setDots((prevDots) => (prevDots.length < 3 ? prevDots + '.' : ''));
      }, 500);
    } else {
      setDots('');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state]);

  const handleInsertToEditorTerminal = (code: string, location: string) => {
    vscode.postMessage({
      command: 'insertCodeSnippet',
      data: {
        code,
        location,
      },
    });
  };

  const handleSmartInsertToEditor = (code: string) => {
    vscode.postMessage({
      command: 'smartCodeInsert',
      data: {
        code: code,
        codeId: codeId,
        location: 'editor',
        filename: fileName,
        relativePath: relativePath,
      },
    });
    setState('processing');
  };

  const handleAccept = (): void => {
    vscode.postMessage({
      command: 'smartCodeInsertUserAction',
      data: {
        action: 'accepted',
        codeId: codeId,
      },
    });
    setState('idle');
  };

  const handleReject = (): void => {
    vscode.postMessage({
      command: 'smartCodeInsertUserAction',
      data: {
        action: 'rejected',
        codeId: codeId,

      },
    });
    setState('idle');
  };

  const handleCopyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      // console.log('Code copied to clipboard!');
    }).catch((err) => {
      // console.error('Failed to copy code: ', err);
    });
  };

  const handleCreateNewFile = (code: string) => {
    vscode.postMessage({
      command: 'createNewFile',
      data: {
        code,
        relativePath,
      },
    });
    setState('idle');
    setShowNewFileDropdownType1(false); // Close dropdown if open
    setShowNewFileDropdownType2(false); // Close dropdown if open
  };

  const handleInsertInCurrentFile = (code: string) => {
    vscode.postMessage({
      command: 'addToFileCurrentlyOpen',
      data: {
        code: code,
        codeId: codeId,
        location: 'editor',
        filename: fileName,
        relativePath: relativePath,
      },
    });
    setState('processing');
    setShowNewFileDropdownType1(false); // Close dropdown if open
    setShowNewFileDropdownType2(false); // Close dropdown if open

  };

  const handleCancel = () => {
    setState('idle');
    setShowNewFileDropdownType1(false); // Close dropdown if open
    setShowNewFileDropdownType2(false); // Close dropdown if open
  };

  if (inline) {
    return (
      <code className={`bg-vscode-editor-background rounded px-1 py-0.5 text-vscode-editor-foreground ${className}`} {...props}>
        {codeContent}
      </code>
    );
  }

  const extractText = (child: React.ReactNode): string => {
    if (typeof child === 'string') {
      return child;
    } else if (Array.isArray(child)) {
      return child.map(extractText).join('');
    } else if (React.isValidElement(child)) {
      return extractText(child.props.children);
    } else {
      return '';
    }
  };

  const code = extractText(codeContent).trim();
  const language = className ? className.replace(/language-|code-highlight/g, '').trim() : '';
  // console.log(language)

  return (
    <div className="my-4 p-0 rounded-sm shadow-lg w-full min-w-[200px]"
      style={{
        backgroundColor: 'var(--vscode-editor-background)',
        borderColor: 'var(--vscode-editorGroup-border)',
        border: '1px solid var(--vscode-editorGroup-border)',
      }}
    >
      <div className="flex h-6 justify-between items-center text-vscode-editor-foreground pl-1 pr-1 py-0 rounded-t-sm"
        style={{
          backgroundColor: 'var(--vscode-editor-background)',
          borderColor: 'var(--vscode-editorGroup-border)',
          borderBottom: '1px solid var(--vscode-editorGroup-border)',
        }}
      >

        <span className="text-xxxs flex items-center"><LanguageIcon fileName={fileName || ""} iconSize={16} />{fileName}</span>
        <div className="flex items-center">
          {state === 'idle' && (
            <div className="flex items-center space-x-1">

              {language === 'bash' || language === 'powershell' || language === 'powershell' ? (
                // Render "T" button for Bash language
                <CodeButtonWithText
                  onClick={() => handleInsertToEditorTerminal(code, 'terminal')}
                  ariaLabel="Run code in Terminal"
                  icon="codicon-terminal"
                  tooltip="Run in Terminal"
                  disabled={isTyping}
                  buttonName={'Terminal'}
                />
              ) : (
                // Render Insert button for other languages
                <CodeButtonWithText
                  onClick={() => handleInsertToEditorTerminal(code, 'editor')}
                  ariaLabel="Insert code to Editor"
                  icon="codicon-arrow-right"
                  tooltip="Insert in Editor"
                  disabled={isTyping}
                />
              )}
              {/* Copy Button */}
              <CodeButtonWithText
                onClick={() => handleCopyToClipboard(code)}
                ariaLabel="Copy code to clipboard"
                icon="codicon-copy"
                tooltip="Copy"
                disabled={isTyping}
              />
              {/* Smart Insert Button */}
              <CodeButtonWithText
                onClick={() => handleSmartInsertToEditor(code)}
                ariaLabel="Smart Insert to Editor"
                icon="codicon-play"
                tooltip="Smart Insert"
                disabled={isTyping}
                buttonName={'Apply'}
              />
            </div>
          )}
          {state === 'processing' && (
            <span className="text-vscode-editor-foreground pr-6">Processing{dots}</span>
          )}
          {state === 'review' && (
            <span className="pl-2 pr-0 flex gap-0">
              <CodeButtonWithText
                onClick={handleAccept}
                ariaLabel={'Accept code'}
                icon="codicon-check"
                tooltip='Accept Code'
                disabled={isTyping}
                buttonName={'Accept'}
              />
              <CodeButtonWithText
                onClick={handleReject}
                ariaLabel={'Reject code'}
                icon="codicon-chrome-close"
                tooltip='Reject Code'
                disabled={isTyping}
                buttonName={'Reject'}
              />
            </span>
          )}
          {state === 'newFileRequiredType1' && (
            <div className="relative">
              <CodeButtonWithText
                onClick={() => setShowNewFileDropdownType1(!showNewFileDropdownType1)}
                ariaLabel="Smart Insert to Editor"
                icon="codicon-play"
                tooltip="Smart Insert"
                disabled={isTyping || showNewFileDropdownType1}
                buttonName={'Apply'}
              >
              </CodeButtonWithText>
              {showNewFileDropdownType1 && (
                <div
                  className="absolute right-0 mt-0 w-56 border rounded shadow-md z-10 p-0 dropdown-container"
                  style={{
                    backgroundColor: 'var(--vscode-editor-background)',
                    borderColor: 'var(--vscode-editorGroup-border)',
                    color: 'var(--vscode-editor-foreground)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => handleCreateNewFile(code)}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    title={`Create new file: ${fileName}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscNewFile className="mr-2" />
                    <span className="truncate">Create New File</span>
                  </div>
                  <div
                    onClick={() => handleInsertInCurrentFile(code)}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscAdd className="mr-2" />
                    <span className="truncate">Add to Current File</span>
                  </div>
                  <div
                    onClick={handleCancel}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    title="Cancel"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscClose className="mr-2" />
                    <span className="truncate">Cancel</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {state === 'newFileRequiredType2' && (
            <div className="relative">
              <CodeButtonWithText
                onClick={() => setShowNewFileDropdownType2(!showNewFileDropdownType2)}
                ariaLabel="Smart Insert to Editor"
                icon="codicon-play"
                tooltip="Smart Insert"
                disabled={isTyping || showNewFileDropdownType2}
                buttonName={'Apply'}
              >
              </CodeButtonWithText>
              {showNewFileDropdownType2 && (
                <div
                  className="absolute right-0 mt-0 w-56 border rounded shadow-md z-10 p-0 dropdown-container"
                  style={{
                    backgroundColor: 'var(--vscode-editor-background)',
                    borderColor: 'var(--vscode-editorGroup-border)',
                    color: 'var(--vscode-editor-foreground)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => handleCreateNewFile(code)}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    title={`Create new file: ${fileName}`}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscNewFile className="mr-2" />
                    <span className="truncate">Create New File</span>
                  </div>
                  <div
                    onClick={() => handleInsertInCurrentFile(code)}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscAdd className="mr-2" />
                    <span className="truncate">Add to Current File</span>
                  </div>
                  <div
                    onClick={handleCancel}
                    className="flex items-center p-1 text-xs cursor-pointer rounded-sm border mb-0"
                    style={{
                      borderColor: 'var(--vscode-editorGroup-border)',
                    }}
                    title="Cancel"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-button-background)';
                      e.currentTarget.style.color = 'var(--vscode-button-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--vscode-editor-background)';
                      e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
                    }}
                  >
                    <VscClose className="mr-2" />
                    <span className="truncate">Cancel</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div
        className="rounded-b-sm transition-all duration-300 ease-in bg-vscode-chat-message-incoming !p-0 !m-0 overflow-auto"
        style={{
          scrollbarColor: 'transparent transparent',
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.scrollbarColor = 'var(--vscode-scrollbarSlider-background) transparent';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.scrollbarColor = 'transparent transparent';
        }}
      >
        <pre className="!m-0">
          <code className={`${className} block p-2 text-vscode-editor-foreground`} {...props}>
            {codeContent}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;