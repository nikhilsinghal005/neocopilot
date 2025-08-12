import React, { useState, useRef, useEffect } from 'react';

import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';

interface CodeButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon: string; // Codicon or other icon class
  text?: string;
  tooltip?: string;
  disabled?: boolean;
  buttonName?: string;
  fontSize?: string;
}

const CodeButtonWithText: React.FC<CodeButtonProps> = ({
  onClick,
  ariaLabel,
  icon,
  tooltip,
  disabled = false,
  buttonName,
  fontSize,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hideTooltipTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseEnter = () => {
      if (wrapperRef.current) {
        const { top, left } = wrapperRef.current.getBoundingClientRect();
        const tooltipTop = top - 38;
        setTooltipPosition({
          top: tooltipTop,
          left: Math.max(left, 0) - 15,
        });
        setIsHovered(true);
        hideTooltipTimeout.current = setTimeout(() => setIsHovered(false), 1500);
      }
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (hideTooltipTimeout.current) {
        clearTimeout(hideTooltipTimeout.current);
      }
    };

    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('mouseenter', handleMouseEnter);
      wrapper.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (wrapper) {
        wrapper.removeEventListener('mouseenter', handleMouseEnter);
        wrapper.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (hideTooltipTimeout.current) {
        clearTimeout(hideTooltipTimeout.current);
      }
    };
  }, []);

  return (
    <>
      {/* If buttonName is provided, render the icon + text. Otherwise, just the icon. */}
      {buttonName ? (
        <VSCodeButton
          onClick={onClick}
          aria-label={ariaLabel}
          disabled={disabled}
          appearance="icon"
          className="inline-flex items-center justify-center h-5"
          style={{
            backgroundColor: 'transparent',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground)';
            e.currentTarget.style.color = 'var(--vscode-button-foreground)';
            e.currentTarget.style.borderRadius = '7%';

          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
          }}
        >
          <div className="flex items-center pr-1" style={{ fontSize: fontSize ? fontSize : '12px' }}>
            <span className={`codicon ${icon} mr-1`} style={{ fontSize: fontSize ? fontSize : '12px' }}></span>
            {buttonName}
          </div>
        </VSCodeButton>
      ) : (
        <VSCodeButton
          onClick={onClick}
          aria-label={ariaLabel}
          disabled={disabled}
          appearance="icon"
          className="inline-flex items-center justify-center h-5"
          style={{
            backgroundColor: 'transparent',
            // width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--vscode-button-secondaryHoverBackground)';
            e.currentTarget.style.color = 'var(--vscode-button-foreground)';
            e.currentTarget.style.borderRadius = '10%';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--vscode-editor-foreground)';
          }}
        >
          <div className="flex items-center justify-center">
          <span
            className={`codicon ${icon}`}
            style={{ fontSize: fontSize ? fontSize : '12px' }}
          ></span>
          </div>
        </VSCodeButton>
      )}

      {isHovered && tooltip && (
        <div
          className="fixed px-2 py-1 text-white text-xs rounded shadow-lg z-50"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: '150px',
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            textAlign: 'right',
          }}
        >
          {tooltip}
        </div>
      )}
    </>
  );
};

export default CodeButtonWithText;
