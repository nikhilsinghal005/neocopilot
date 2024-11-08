import React from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import '@vscode/codicons/dist/codicon.css';

interface CodeButtonProps {
  onClick: () => void;
  ariaLabel: string;
  icon: string;
  text?: string;
}

const CodeButton: React.FC<CodeButtonProps> = ({ onClick, ariaLabel, icon, text }) => (
  <VSCodeButton onClick={onClick} appearance="icon" aria-label={ariaLabel}>
    <span className={`codicon ${icon}`}></span>
    {text && <span className="ml-2">{text}</span>} {/* Only render text if provided */}
  </VSCodeButton>
);

export default CodeButton;
