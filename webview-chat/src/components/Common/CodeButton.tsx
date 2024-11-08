import React, { useState, useRef, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';

interface CodeButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon: string;
  text?: string;
  tooltip?: string;
  disabled?: boolean; // Optional disabled prop
}

const CodeButton: React.FC<CodeButtonProps> = ({ onClick, ariaLabel, icon, text, tooltip, disabled = false }) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  let hideTooltipTimeout: ReturnType<typeof setTimeout>;

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const horizontalPadding = 16; // Distance between tooltip and button
      const verticalOffset = 4; // Small offset to position below the button

      // Position tooltip to the left and slightly below the button
      const newLeft = iconRect.left - iconRect.width - horizontalPadding;
      const newTop = iconRect.top + iconRect.height + verticalOffset;

      setTooltipPosition({
        top: newTop,
        left: newLeft,
      });

      // Show tooltip and set timeout for it to disappear after 1.5 seconds
      setIsHovered(true);
      hideTooltipTimeout = setTimeout(() => setIsHovered(false), 1500);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    clearTimeout(hideTooltipTimeout); // Clear timeout when leaving button
  };

  // Clear timeout on component unmount to prevent memory leaks
  useEffect(() => {
    return () => clearTimeout(hideTooltipTimeout);
  }, []);

  return (
    <div className="inline-block relative" ref={iconRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <VSCodeButton 
        onClick={onClick} 
        appearance="icon" 
        aria-label={ariaLabel}
        disabled={disabled} // Apply disabled prop
      >
        <span className={`codicon ${icon}`}></span>
        {text && <span className="ml-2">{text}</span>}
      </VSCodeButton>

      {isHovered && tooltip && (
        <div 
          className="fixed px-2 py-1 text-white text-xs rounded shadow-lg z-50"
          style={{ 
            top: tooltipPosition.top, 
            left: tooltipPosition.left, 
            maxWidth: '150px', // Set maximum width for longer text
            whiteSpace: 'nowrap', // Prevents wrapping, so the tooltip expands to fit text
            backgroundColor: 'rgba(0, 0, 0, 0.15)', // Dark background with opacity
            textAlign: 'right', // Align text to the right
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
};

export default CodeButton;
