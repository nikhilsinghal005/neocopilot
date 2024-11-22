import React, { useState, useRef, useEffect } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';

interface NormalButtonProps {
  onClick: () => void;
  ariaLabel: string;
  text: string;
  tooltip?: string;
  disabled?: boolean; // Optional disabled prop
  type?: 'primary' | 'secondary'; // Button type prop: 'primary' or 'secondary'
}

const NormalButton: React.FC<NormalButtonProps> = ({ onClick, ariaLabel, text, tooltip, disabled = false, type = 'primary' }) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLDivElement | null>(null);
  let hideTooltipTimeout: ReturnType<typeof setTimeout>;

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const horizontalPadding = 16; // Distance between tooltip and button
      const verticalOffset = 4; // Small offset to position below the button

      // Position tooltip to the left and slightly below the button
      const newLeft = buttonRect.left - buttonRect.width - horizontalPadding;
      const newTop = buttonRect.top + buttonRect.height + verticalOffset;

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
    <div className="inline-block relative" ref={buttonRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <VSCodeButton 
        onClick={onClick} 
        appearance={type} // Apply the button type: 'primary' or 'secondary'
        aria-label={ariaLabel}
        disabled={disabled} // Apply disabled prop
      >
        {text}
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

export default NormalButton;
