import React, { useState, useEffect } from 'react';
import { useVscode } from '../../context/VscodeContext';
import CodeButton from '../Common/CodeButton';
import CodeButtonNormal from '../Common/CodeButtonNormal';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  codeContent?: React.ReactNode; // Make sure this is optional
  fileName?: string,
  relativePath: string,
  [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, codeContent, fileName, relativePath,  ...props }) => {
  const vscode = useVscode();
  const [state, setState] = useState<'idle' | 'processing' | 'review'>('idle');
  const [dots, setDots] = useState('');
  const codeId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []); // Generate unique ID for the code block

  useEffect(() => {
    const handleSmartInsertToEditorUpdate = (event: MessageEvent) => {
      // console.log("smart Inser Call -----------------------------", event.data)
      if (event.data.command === 'smart_insert_to_editor_update' && event.data.codeId === codeId) {
        // console.log('Smart Insert to Editor Update', event.data);
        if (!event.data.isComplete) {
          setState('idle');
        }else{
          setState('review');
        }
        
      }
    };

    window.addEventListener('message', handleSmartInsertToEditorUpdate);

    return () => {
      window.removeEventListener('message', handleSmartInsertToEditorUpdate);
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
    <div className="my-4 p-0 rounded-lg shadow-lg border"
      style={{
        backgroundColor: 'var(--vscode-editor-background)',
        borderColor: 'var(--vscode-editorGroup-border)',
      }}
    >
      <div className="flex justify-between items-center bg-vscode-chat-message-incoming text-vscode-editor-foreground px-4 py-1 rounded-t-md border"
        style={{ borderColor: 'var(--vscode-editorGroup-border)' }}
      >
        <span className="text-xs font-semibold">{fileName}</span>
        <div className="flex">
          {state === 'idle' && (
            <>
              {/* Smart Insert Button */}
              <CodeButton
                onClick={() => handleSmartInsertToEditor(code)}
                ariaLabel="Smart Insert to Editor"
                icon="codicon-play"
                tooltip="Smart Insert"
              />
              {language === 'bash' || language === 'powershell' || language === 'powershell' ? (
                // Render "T" button for Bash language
                <CodeButton
                  onClick={() => handleInsertToEditorTerminal(code, 'terminal')}
                  ariaLabel="Run code in Terminal"
                  icon="codicon-terminal"
                  tooltip="Run in Terminal"
                />
              ) : (
                // Render Insert button for other languages
                <CodeButton
                  onClick={() => handleInsertToEditorTerminal(code, 'editor')}
                  ariaLabel="Insert code to Editor"
                  icon="codicon-arrow-right"
                  tooltip="Insert in Editor"
                />
              )}
              {/* Copy Button */}
              <CodeButton
                onClick={() => handleCopyToClipboard(code)}
                ariaLabel="Copy code to clipboard"
                icon="codicon-copy"
                tooltip="Copy"
              />
            </>
          )}
          {state === 'processing' && (
            <span className="text-vscode-editor-foreground">Processing{dots}</span>
          )}
          {state === 'review' && (
            <span className="px-2 flex gap-2">
              <CodeButtonNormal
                onClick={handleAccept}
                ariaLabel={'Accept code'}
                text={'Accept'}
                tooltip='Accept Code'
                type='primary'
              />
              <CodeButtonNormal
                onClick={handleReject}
                ariaLabel={'Reject code'}
                text={'Reject'}
                tooltip='Reject Code'
                type='secondary'
              />
            </span>
          )}
        </div>
      </div>
      <div className="rounded-b-md overflow-auto bg-vscode-chat-message-incoming !p-0 !m-0">
        <pre className="!m-0">
          <code className={`${className} block p-4 text-vscode-editor-foreground`} {...props}>
            {codeContent}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
