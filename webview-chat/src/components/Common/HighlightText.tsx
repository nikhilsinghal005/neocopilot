import React, { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../../context/ChatContext';
import AttachFileListDropdown from '../InputBarChat/AttachFileList';
import FunctionListDropdown from '../InputBarChat/OutlineFile';
import { FunctionOutline, CurrentFileContext } from '../../types/Message';

interface HighlightedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  className: string;
  placeholder: string;
  style: React.CSSProperties;
  rows: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface DropdownOption {
  label: string;
  value: string;
}

const HighlightedTextarea: React.FC<HighlightedTextareaProps> = ({ 
  value, 
  onChange, 
  onPaste, 
  className, 
  placeholder, 
  style,
  rows,
  onKeyDown 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFileList, setShowFileList] = useState(false);
  const [showFunctionList, setShowFunctionList] = useState(false);

  const options: DropdownOption[] = [
    { label: 'Files', value: 'files' },
    { label: 'Functions', value: 'function' }
  ];

  // Highlight text with @ mentions
  const highlightText = (text: string) => {
    const segments = text.split(/(@{1,2}\S*)/g);
    return segments
      .map((segment) => {
        if (segment.startsWith('@') && !segment.startsWith('@@')) {
          return `<span style="background-color: var(--vscode-textLink-foreground); opacity: 0.2; border-radius: 2px;">${segment}</span>`;
        }
        return segment;
      })
      .join('');
  };

  const { attachedContext, setAttachedContext } = useChatContext();

  // Calculate dropdown position based on caret location
  const updateDropdownPosition = () => {
    if (!textareaRef.current || !containerRef.current) return;
    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    const textBeforeCaret = textarea.value.substring(0, selectionStart);
    const temp = document.createElement('div');
    temp.style.cssText = window.getComputedStyle(textarea).cssText;
    temp.style.height = 'auto';
    temp.style.position = 'absolute';
    temp.style.whiteSpace = 'pre-wrap';
    temp.textContent = textBeforeCaret;
    document.body.appendChild(temp);
    const dropdownWidth = 256;
    const dropdownHeight = 200;
    const textareaRect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    let left = temp.clientWidth % textareaRect.width;
    let top = Math.floor(temp.clientWidth / textareaRect.width) * lineHeight;
    if (left + dropdownWidth > textareaRect.width) {
      left = textareaRect.width - dropdownWidth;
    }
    left = Math.max(0, left);
    top = Math.max(0, top - dropdownHeight - 5);
    document.body.removeChild(temp);
    setDropdownPosition({ top, left });
  };

  // Determine whether to show the dropdown based on the text and caret position
  const shouldShowDropdown = (text: string, position: number) => {
    if (position <= 0 || position > text.length) return false;
    const lastChar = text[position - 1];
    const prevChar = position > 1 ? text[position - 2] : null;
    const nextChar = position < text.length ? text[position] : null;
    if (lastChar === '@' && (prevChar === '@' || nextChar === '@')) {
      return false;
    }
    return lastChar === '@' && (prevChar === ' ' || prevChar === null);
  };

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.innerHTML = highlightText(value);
    }
    const shouldShow = shouldShowDropdown(value, textareaRef.current?.selectionStart || 0);
    if (shouldShow && textareaRef.current) {
      updateDropdownPosition();
      setShowDropdown(true);
      setSelectedIndex(0);
    } else if (!shouldShow && !showFileList && !showFunctionList) {
      setShowDropdown(false);
    }
  }, [value]);

  // Remove context entries if their mention is removed from the text
  useEffect(() => {
    const updatedContext = attachedContext.filter((context: any) => {
      if (context.isAttachedInText && context.fileName) {
        return value.includes(`@${context.fileName}`);
      }
      return true;
    });
    if (updatedContext.length !== attachedContext.length) {
      setAttachedContext(updatedContext);
    }
  }, [value, attachedContext, setAttachedContext]);

  // Handle key events for both the textarea and dropdown navigation
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];
    if (e.key === 'Backspace' && currentWord.startsWith('@') && currentWord.length > 1) {
      e.preventDefault();
      const textBeforeMention = value.slice(0, cursorPosition - currentWord.length);
      const textAfterCursor = value.slice(cursorPosition);
      const newValue = textBeforeMention + textAfterCursor;
      const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(event);
      return;
    }

    if (!showDropdown && !showFileList && !showFunctionList) {
      onKeyDown(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!showFileList && !showFunctionList) {
          setSelectedIndex(prev => (prev + 1) % options.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!showFileList && !showFunctionList) {
          setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (!showFileList && !showFunctionList) {
          handleOptionSelect(options[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setShowFileList(false);
        setShowFunctionList(false);
        break;
      default:
        onKeyDown(e);
    }
  };

  // Handle selection of a dropdown option (files or functions)
  const handleOptionSelect = (option: DropdownOption) => {
    if (option.value === 'files') {
      setShowFileList(true);
      return;
    }
    if (option.value === 'function') {
      setShowFunctionList(true);
      return;
    }
    const textBeforeCaret = value.slice(0, textareaRef.current?.selectionStart);
    const textAfterCaret = value.slice(textareaRef.current?.selectionStart);
    const newValue = `${textBeforeCaret}${option.label} ${textAfterCaret}`;
    
    const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(event);
    setShowDropdown(false);
    setShowFileList(false);
    setShowFunctionList(false);
  };

  // Handle file selection from the file list dropdown
  const handleFileSelect = (file: any) => {
    const textBeforeCaret = value.slice(0, textareaRef.current?.selectionStart);
    const textAfterCaret = value.slice(textareaRef.current?.selectionStart);
    const lastAtSymbol = textBeforeCaret.lastIndexOf('@');
    const newValue = `${textBeforeCaret.slice(0, lastAtSymbol)}@${file.fileName} ${textAfterCaret}`;
    const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(event);
    setShowDropdown(false);
    setShowFileList(false);
  };

  // Handle function selection from the function list dropdown.
  // This updates the textarea content and the attached context.
  const handleFunctionSelect = (selectedFunction: FunctionOutline) => {
    console.log("Select is running")
    // const cursorPosition = textareaRef.current?.selectionStart || 0;
    // const textBeforeCaret = value.slice(0, cursorPosition);
    // const lastAtSymbol = textBeforeCaret.lastIndexOf('@');
    // const newValue = `${textBeforeCaret.slice(0, lastAtSymbol)}@${selectedFunction.name} ${value.slice(cursorPosition)}`;
    // const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
    // onChange(event);

    // Create a new attached context entry.
    const newContext: CurrentFileContext = {
      "fileName": "test1.js",
      "filePath": "test1.js",
      "isActive": true,
      "isOpened": true,
      "isSelected": true,
      "isAttachedInContextList": true,
      "isManuallyAddedByUser": true,
      "isAttachedInText": false,
      "languageId": "python"
  };

    console.log("Updated COntext before", attachedContext)
    setAttachedContext(prevContext => [...prevContext, newContext]);

    // setAttachedContext([...attachedContext, newContext]);
    console.log("Updated COntext", attachedContext)
    setShowFunctionList(false);
    setShowDropdown(false);
  };

  // Sync the scroll position between the overlay and the textarea.
  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative w-full" style={{ zIndex: 1 }} ref={containerRef}>
      <div
        ref={overlayRef}
        className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none whitespace-pre-wrap break-words px-2 py-1"
        style={{
          ...style,
          color: 'transparent',
          zIndex: 1,
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onPaste={onPaste}
        onScroll={syncScroll}
        className={`${className} relative`}
        placeholder={placeholder}
        style={{
          ...style,
          background: 'transparent',
          zIndex: 2,
          width: '100%',
        }}
        rows={rows}
        onKeyDown={handleTextareaKeyDown}
      />
      {(showDropdown || showFileList || showFunctionList) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 shadow-lg rounded-md border w-64"
          style={{
            bottom: `${(textareaRef.current?.offsetHeight || 0) + 10}px`,
            left: dropdownPosition.left,
            backgroundColor: 'var(--vscode-editor-background)',
            borderColor: 'var(--vscode-editorGroup-border)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {showFileList ? (
            <AttachFileListDropdown 
              onFileSelect={(file) => {
                handleFileSelect(file);
                setShowFileList(false);
              }}
              handleKeyDown={(e) => handleTextareaKeyDown(e as React.KeyboardEvent<HTMLTextAreaElement>)}
            />
          ) : showFunctionList ? (
            <FunctionListDropdown
              onFunctionSelect={handleFunctionSelect}
              handleKeyDown={(e) => handleTextareaKeyDown(e as React.KeyboardEvent<HTMLTextAreaElement>)}
            />
          ) : (
            options.map((option, index) => (
              <div
                key={option.value}
                className="p-1 cursor-pointer rounded-xs overflow-hidden text-ellipsis whitespace-nowrap border-b"
                onClick={() => handleOptionSelect(option)}
                style={{
                  backgroundColor: selectedIndex === index ? 
                    'var(--vscode-list-activeSelectionBackground)' : 
                    'var(--vscode-editor-background)',
                  color: 'var(--vscode-editor-foreground)',
                  borderColor: 'var(--vscode-editorGroup-border)',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {option.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HighlightedTextarea;
