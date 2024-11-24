import React, { useState, useEffect, useCallback } from 'react';
import { VSCodeButton, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../context/ChatContext';
import { useVscode } from '../../context/VscodeContext';
import { CurrentFileContext, EditorOpenFileList } from '../../types/Message';

interface InputBarProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isTyping: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, isTyping }) => {
  const [warningMessage, setWarningMessage] = useState('');
  const { isTyping: contextIsTyping, chatModel, setChatModel, attachedContext, setAttachedContext, openEditorFilesList, setOpenEditorFilesList } = useChatContext();
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
          // If the user opened a file in the editor,       
          console.log('message opened in editor'); 
          const newContext: CurrentFileContext = {
            currentSelectedFileName: event.data.currentSelectedFileName,
            currentSelectedFileRelativePath: event.data.currentSelectedFileRelativePath,
            slectionType: event.data.action,
          };

          // Check if the file already exists in the context
          const exists = attachedContext.some(context => 
            context.currentSelectedFileName === newContext.currentSelectedFileName &&
            context.currentSelectedFileRelativePath === newContext.currentSelectedFileRelativePath
          );
          if (!exists) {
            // If it doesn't exist, filter out any context with slectionType "user_opened"
            const updatedContext = attachedContext.filter(context => context.slectionType !== 'user_opened_in_editor');
            setAttachedContext([...updatedContext, newContext]);
          }
        }  else {
          const updatedContext = attachedContext.filter(context => context.slectionType !== 'user_opened_in_editor');
          setAttachedContext([...updatedContext]);
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

  // Function to sanitize input to prevent code execution
  const sanitizeInput = (input: string): string => {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const handleClick = () => {
    if (isTyping) {
      setWarningMessage('Please wait, the assistant is still responding.');
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }

    const sanitizedInput = sanitizeInput(input);
    setInput(sanitizedInput);
    handleSendMessage();
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

    // Add the removed item back to openEditorFilesList
    const removedFile = attachedContext.find(context => context.currentSelectedFileRelativePath === filePath);
    if (removedFile) {
      setOpenEditorFilesList([...openEditorFilesList, {
        fileName: removedFile.currentSelectedFileName,
        filePath: removedFile.currentSelectedFileRelativePath,
        languageId: '' // Assuming languageId is not available, you can adjust this accordingly
      }]);
    }
  };

  const handleListItemClick = (item: EditorOpenFileList) => {
    setSelectedItem(item.fileName);
    setShowList(false);

    if (attachedContext.length <= 3) {
      // Remove the selected item from openEditorFilesList and add it to attachedContext
      const updatedOpenFilesList = openEditorFilesList.filter(file => file.filePath !== item.filePath);
      setOpenEditorFilesList(updatedOpenFilesList);

      const newContext: CurrentFileContext = {
        currentSelectedFileName: item.fileName,
        currentSelectedFileRelativePath: item.filePath,
        slectionType: 'user_selection',
      };

      setAttachedContext([...attachedContext, newContext]);
    } else {
      showUserNotification("Context Information", "You can only allowed to attach 3 files at a time.")
    }
  };

  const handleResize = useCallback(() => {
    const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to calculate the scroll height
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 50), 140); // Keep within min/max, reduced overall height slightly
      textarea.style.height = `${newHeight}px`;

      // Update the CSS variable for `input-container`
      document.documentElement.style.setProperty('--input-container-height', `${newHeight + 40}px`); // Adding padding/margin as needed
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
          {/* Enhanced Code Insert Button and Tag */}
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
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-var(--vscode-editor-background) border border-var(--vscode-editorGroup-border) rounded shadow-md z-10 p-2 dropdown-container">
                {openEditorFilesList.length > 0 ? (
                  openEditorFilesList.map((file) => (
                    <div
                      key={file.filePath}
                      onClick={() => handleListItemClick(file)}
                      className="p-1 cursor-pointer rounded-sm hover:bg-var(--vscode-list-hoverBackground)"
                      style={{
                        color: 'var(--vscode-editor-foreground)',
                      }}
                    >
                      {file.fileName}
                    </div>
                  ))
                ) : (
                  <div className="p-1 text-center" style={{ color: 'var(--vscode-editor-foreground)' }}>
                    No opened editors
                  </div>
                )}
              </div>
            )}
            {attachedContext.map((context, index) => (
                <span
                  key={index} // Use a unique key for each element
                  className="rounded-sm px-1 flex items-center h-5 text-xxs border max-w-xs overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--vscode-editor-background)',
                    borderColor: 'var(--vscode-editorGroup-border)',
                    color: 'var(--vscode-editor-foreground)',
                  }}
                >
                  {context.currentSelectedFileName || 'Current File'}
                  <VSCodeButton
                    appearance="icon"
                    aria-label="Remove Context"
                    className="mr-1 p-0 rounded-none h-3 w-3"
                    onClick={() => handleRemoveTag(context.currentSelectedFileRelativePath)}
                  >
                    <span className="codicon codicon-close text-xxs"></span>
                  </VSCodeButton>
                </span>
              ))}
            </div>
        </div>
        <div className="chat-wrapper w-full h-full flex flex-col items-center p-1 pt-0">
          {/* Input Container */}
          <div 
            className="input-container flex flex-col gap-0 w-full max-w-2xl p-0 border rounded-sm"
            style={{
              backgroundColor: 'var(--vscode-editor-background)',
              borderColor: 'var(--vscode-editorGroup-border)',
              color: 'var(--vscode-editor-foreground)',
            }}
          >
            {/* Top Section: Text Input */}
            <div className="top-section flex items-center gap-2">
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

            {/* Bottom Section: Dropdown on Left, Buttons on Right */}
            <div className="bottom-section flex justify-between items-center gap-2 mt-0 p-0"
              style={{
                borderTop: `1px solid var(--vscode-editorGroup-border)`,
              }}
            >
              {/* Dropdown Selector on Left */}
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

              {/* Right Section: Attachment and Send Buttons */}
              <div className="button-group flex items-center gap-2" style={{ marginRight: '4px' }}>
                {/* Attachment Icon Button */}
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

                {/* Send Button */}
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
              </div>
            </div>
          </div>

          {/* Warning message */}
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
