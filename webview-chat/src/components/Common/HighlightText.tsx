import React, { useEffect, useRef } from 'react';

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
  
  const highlightText = (text: string) => {
    return text.replace(
      /(@\S+)/g, 
      '<span style="background-color: var(--vscode-textLink-foreground); opacity: 0.2; border-radius: 2px;">$1</span>'
    );
  };

  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.innerHTML = highlightText(value);
    }
  }, [value]);

  return (
    <div className="relative w-full"style={{ zIndex: 1 }}>
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
        }}
        rows={rows}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default HighlightedTextarea;