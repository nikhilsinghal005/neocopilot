import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeButton, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { useVscode } from '../../context/VscodeContext';
import { CurrentFileContext, EditorOpenFileList } from '../../types/Message';
import MessageRenderer from './MessageRenderer';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
  const [warningMessage, setWarningMessage] = useState('');
  const { isTyping: contextIsTyping, chatModel, setChatModel, attachedContext, setAttachedContext, openEditorFilesList, setOpenEditorFilesList, setIsTyping, setIsInterrupted } = useChatContext();
  const vscode = useVscode();
  const [showList, setShowList] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'insert_messages') {
        console.log('Received chat message from VS Code:', event.data);
        setInput(event.data.inputText || '');
      }
    };

    window.addEventListener('message', handleIncomingMessage);

    return () => {
      window.removeEventListener('message', handleIncomingMessage);
    };
  }, [setInput]);

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {

      if (event.data.command === 'editor_changed_context_update_event') {
        console.log('Received chat message from VS Code changed Editor:', event.data);

        if (event.data.action === 'user_opened_in_editor') {

          // check if file already exists in the context
          const exists = attachedContext.some(context => 
            context.currentSelectedFileName === event.data.currentSelectedFileName &&
            context.currentSelectedFileRelativePath === event.data.currentSelectedFileRelativePath
          );

          if (exists) {
            // Update the isCurrentlyOpen value to true for the current file and false for others
            setAttachedContext(attachedContext.map(context => 
              context.currentSelectedFileName === event.data.currentSelectedFileName &&
              context.currentSelectedFileRelativePath === event.data.currentSelectedFileRelativePath
                ? { ...context, isCurrentlyOpen: true }
                : { ...context, isCurrentlyOpen: false }
            ));
          } else {
            const newContext: CurrentFileContext = {
              currentSelectedFileName: event.data.currentSelectedFileName,
              currentSelectedFileRelativePath: event.data.currentSelectedFileRelativePath,
              slectionType: event.data.action,
              isCurrentlyOpen: true,
              isUserSelected: false
            };

            const updatedContext = attachedContext.filter(context => context.isUserSelected).map(context => ({ ...context, isCurrentlyOpen: false }));
            setAttachedContext([newContext , ...updatedContext]);
          }
        }  else {
          const updatedContext = attachedContext
            .filter(context => context.slectionType === 'user_opened_in_editor')
            .map(context => ({ ...context, isCurrentlyOpen: false }));
          setAttachedContext(updatedContext);
        }
      }
    };
  
    window.addEventListener('message', handleIncomingMessage);
  
    return () => {
      window.removeEventListener('message', handleIncomingMessage);
    };
  }, [attachedContext, setAttachedContext]);

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'editor_open_files_list_update_event') {
        console.log('List of Files Received:', event.data);
        const updatedOpenFilesList = event.data.openFiles.filter((file: EditorOpenFileList) => 
          !attachedContext.some(context => context.currentSelectedFileRelativePath === file.filePath)
        );
        setOpenEditorFilesList(updatedOpenFilesList);
      }
    };
    window.addEventListener('message', handleIncomingMessage);
    return () => {
      window.removeEventListener('message', handleIncomingMessage);
    };
  }, [attachedContext, setOpenEditorFilesList]);

  const sanitizeInput = (input: string): string => {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const handleClick = () => {
    if (isTyping) {
      setWarningMessage('Please wait, the assistant is still responding.');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }
    setIsInterrupted(false);
    const sanitizedInput = sanitizeInput(input);
    setInput(sanitizedInput);
    handleSendMessage();
    setIsTyping(true); // Set typing to true when a message is sent
  };

  const handleStopClick = () => {
    // Logic to handle stop action
    setIsTyping(false); // Set typing to false to stop the process
    setIsInterrupted(true)
    // Additional logic to stop the ongoing process can be added here
  };

  const handleCodeInsertClick = () => {
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        "title": "Insert Code",
        "message": "Neo is currently developing this feature and it will be available shortly."
      },
    });
  };

  const showUserNotification = (title: string, message: string) => {
    vscode.postMessage({
      command: 'showInfoPopup',
      data: {
        "title": title,
        "message": message
      },
    });
  };

  const handlePlusIconClick = () => {
    setShowList((prev) => !prev);
  };

  const handleRemoveTag = (filePath: string) => {
    const updatedAttachedContext = attachedContext.filter(context => context.currentSelectedFileRelativePath !== filePath);
    setAttachedContext(updatedAttachedContext);

    const removedFile = attachedContext.find(context => context.currentSelectedFileRelativePath === filePath);
    if (removedFile) {
      setOpenEditorFilesList([...openEditorFilesList, {
        fileName: removedFile.currentSelectedFileName,
        filePath: removedFile.currentSelectedFileRelativePath,
        languageId: ''
      }]);
    }
  };

  const handleListItemClick = (item: EditorOpenFileList) => {
    setSelectedItem(item.fileName);
    setShowList(false);

    if (attachedContext.length < 3) {
      const updatedOpenFilesList = openEditorFilesList.filter(file => file.filePath !== item.filePath);
      setOpenEditorFilesList(updatedOpenFilesList);

      const newContext: CurrentFileContext = {
        currentSelectedFileName: item.fileName,
        currentSelectedFileRelativePath: item.filePath,
        slectionType: 'user_selection',
        isCurrentlyOpen: false,
        isUserSelected: true
      };

      setAttachedContext([...attachedContext, newContext]);
    } else {
      showUserNotification("Context Information", "You can only attach up to 3 files at a time.")
    }
  };

  const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 140);
      textarea.style.height = `${newHeight}px`;
      document.documentElement.style.setProperty('--input-container-height', `${newHeight + 40}px`);
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [input, isTyping, handleResize]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.plus-icon-button')) {
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

  return (
    <>
      <div className="complete-wrapper w-full h-full flex flex-col items-center px-0 pt-0">
        <div className="context-wrapper w-full h-full flex flex-row items-center p-1 pt-0 gap-2"
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
              <div className="absolute bottom-full left-0 mb-2 w-56 border rounded shadow-md z-10 p-0 dropdown-container"
              style={{
                backgroundColor: 'var(--vscode-editor-background)',
                borderColor: 'var(--vscode-editorGroup-border)',
                color: 'var(--vscode-editor-foreground)',
                overflow: 'hidden'
              }}
              >
                {openEditorFilesList.length > 0 ? (
                  openEditorFilesList.map((file) => (
                    <div
                      key={file.filePath}
                      onClick={() => handleListItemClick(file)}
                      className="p-1 cursor-pointer rounded-sm overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--vscode-editor-background)',
                        borderColor: 'var(--vscode-editorGroup-border)',
                        color: 'var(--vscode-editor-foreground)'
                      }}
                      title={file.filePath}
                    >
                      {file.filePath.length > 30 ? `${file.filePath.slice(0, 7)}...${file.filePath.slice(-23)}` : file.filePath}
                    </div>
                  ))
                ) : (
                  <div className="p-1 text-center" style={{ color: 'var(--vscode-editor-foreground)' }}>
                    No opened editors
                  </div>
                )}
              </div>
            )}
            {attachedContext.length > 0 ? (
              attachedContext.map((context, index) => (
                context.currentSelectedFileName && context.currentSelectedFileRelativePath ? (
                  <span
                    key={index}
                    className="rounded-sm px-1 flex items-center h-5 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--vscode-editor-background)',
                      borderColor: 'var(--vscode-editorGroup-border)',
                      color: 'var(--vscode-editor-foreground)',
                      position: 'relative'
                    }}
                  >
                    {context.isCurrentlyOpen && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'green',
                          borderRadius: '50%',
                          display: 'inline-block',
                          marginRight: '4px'
                        }}
                      ></span>
                    )}
                    {context.currentSelectedFileName}
                    <VSCodeButton
                      appearance="icon"
                      aria-label="Remove Context"
                      className="mr-1 p-0 rounded-none h-3 w-3"
                      onClick={() => handleRemoveTag(context.currentSelectedFileRelativePath)}
                    >
                      <span className="codicon codicon-close text-xxs"></span>
                    </VSCodeButton>
                  </span>
                ) : null
              ))
            ) : (
              <span
                className="rounded-sm px-1 flex items-center h-5 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--vscode-editor-background)',
                  borderColor: 'var(--vscode-editorGroup-border)',
                  color: 'var(--vscode-editor-foreground)',
                }}
              >
                No file selected
              </span>
            )}
          </div>
        </div>
        <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-0">
          <div 
            className="input-container flex flex-col gap-0 w-full max-w-2xl p-0 border rounded-sm"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              borderColor: 'var(--vscode-editorGroup-border)',
              color: 'var(--vscode-editor-foreground)',
            }}
          >
            <div className="top-section flex items-center gap-2">
              <MessageRenderer text={input} /> {/* Using MessageRenderer */}
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleResize();
                }}
                placeholder="Type your message..."
                className="flex-grow bg-transparent outline-none p-2 resize-none input-textarea text-sm"
                style={{
                  color: 'var(--vscode-editor-foreground)',
                  minHeight: '1.3em',
                  backgroundColor: 'transparent',
                }}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleClick();
                  }
                }}
              />
            </div>

            <div className="bottom-section flex justify-between items-center gap-2 mt-0 p-0"
              style={{
                borderTop: `1px solid var(--vscode-editorGroup-border)`,
              }}
            >
              <VSCodeDropdown
                className="rounded-md p-0 outline-none text-sm"
                style={{
                  backgroundColor: 'var(--vscode-editor-background)',
                  color: 'var(--vscode-editor-foreground)',
                  borderColor: 'var(--vscode-editorGroup-border)',
                }}
                value={chatModel}
                onChange={(e) => {
                  if (e.target) {
                    setChatModel((e.target as HTMLSelectElement).value);
                  }
                }}
              >
                <VSCodeOption value="neo-1">Neo-Basic</VSCodeOption>
                <VSCodeOption value="neo-7">Neo-Expert</VSCodeOption>
              </VSCodeDropdown>

              <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
                <VSCodeButton
                  onClick={handleCodeInsertClick}
                  appearance="icon"
                  aria-label="Attach Image"
                  disabled={isTyping}
                  className="rounded-none"
                  style={{
                    color: 'var(--vscode-button-foreground)',
                  }}
                >
                  <span className="codicon codicon-file-media"></span>
                </VSCodeButton>

                {isTyping ? (
                  <VSCodeButton
                    onClick={handleStopClick}
                    appearance="icon"
                    aria-label="Stop"
                    className="rounded-none"
                    style={{
                      color: 'var(--vscode-button-foreground)',
                    }}
                  >
                    <span className="codicon codicon-debug-stop"></span>
                  </VSCodeButton>
                ) : (
                  <VSCodeButton
                    onClick={handleClick}
                    appearance="icon"
                    aria-label="Send Message"
                    disabled={isTyping}
                    className="rounded-none"
                    style={{
                      color: 'var(--vscode-button-foreground)',
                    }}
                  >
                    <span className="codicon codicon-send"></span>
                  </VSCodeButton>
                )}
              </div>
            </div>
          </div>

          {warningMessage && (
            <div className="text-sm mt-1" style={{ color: 'var(--vscode-errorForeground)' }}>
              {warningMessage}
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default InputBar;
