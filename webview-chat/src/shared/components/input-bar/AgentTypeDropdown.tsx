import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import { AgentDetail } from '../../../shared/types/AppDetails';
import { ChevronDown, HelpCircle, Bot } from 'lucide-react';

const ICON_SIZE_MENU = 14; // size for icons inside the dropdown list
const ICON_SIZE_SELECTED = 12; // smaller size for the selected (button) display

const AgentTypeDropdown: React.FC = () => {
  const { agentType, setAgentType, isTyping } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>();

  const agentTypes: AgentDetail[] = [
    {
      agentId: 'ask',
      agentName: 'Ask',
      agentDescription: 'Your general-purpose assistant for a wide range of tasks.',
  icon: <HelpCircle size={ICON_SIZE_MENU} />,
    },
    {
      agentId: 'agent',
      agentName: 'Agent',
      agentDescription: 'A specialized agent for more complex, multi-step tasks.',
  icon: <Bot size={ICON_SIZE_MENU} />,
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Measure button width so dropdown menu is at least that wide (prevents jitter)
  useLayoutEffect(() => {
    if (buttonRef.current) {
      setButtonWidth(buttonRef.current.offsetWidth);
    }
  }, [agentType, isOpen]);

  return (
    <div className="relative inline-block align-middle" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTyping}
        ref={buttonRef}
        className="flex items-center gap-1 px-1 py-0 border rounded-sm disabled:opacity-50 transition-colors whitespace-nowrap"
        style={{
          background: isOpen
            ? 'var(--vscode-dropdown-background, var(--vscode-input-background))'
            : 'var(--vscode-editor-background, transparent)',
          color: 'var(--vscode-dropdown-foreground, var(--vscode-input-foreground))',
          borderColor: 'var(--vscode-dropdown-border, var(--vscode-input-border))',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {e.currentTarget.style.background = 'var(--vscode-dropdown-background, var(--vscode-input-background))';}
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {e.currentTarget.style.background = 'var(--vscode-editor-background, transparent)';}
        }}
      >
        <div className="flex items-center gap-1 leading-none">
          {/* Render a cloned version of the icon at a smaller size for the selected display */}
          <span className="flex items-center" style={{ lineHeight: 0 }}>
            {React.cloneElement(agentType.icon as React.ReactElement, { size: ICON_SIZE_SELECTED })}
          </span>
          <span className="text-sm">{agentType.agentName}</span>
        </div>
        <ChevronDown size={ICON_SIZE_SELECTED} />
      </button>
      {isOpen && (
        <div
          className="absolute bottom-full mb-1 rounded-sm shadow-lg z-10 overflow-hidden border"
          style={{
            background: 'var(--vscode-dropdown-background, var(--vscode-input-background))',
            color: 'var(--vscode-dropdown-foreground, var(--vscode-input-foreground))',
            borderColor: 'var(--vscode-dropdown-border, var(--vscode-input-border))',
            minWidth: buttonWidth ? `${buttonWidth}px` : undefined,
            width: 'max-content',
          }}
        >
          {agentTypes.map((agent) => (
            <div
              key={agent.agentId}
              onClick={() => {
                setAgentType(agent);
                setIsOpen(false);
              }}
              className="px-2 py-1 cursor-pointer transition-colors"
              style={{
                // Hover via group not possible inline; rely on :hover pseudo-class using a CSS var for consistency
                // Tailwind arbitrary value fallback retained
                // We'll keep a minimal class and let custom var supply color.
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--vscode-list-hoverBackground, var(--vscode-editor-hoverHighlightBackground, rgba(255,255,255,0.05)))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="flex items-center gap-2">
                {agent.icon}
                <div className="font-medium">{agent.agentName}</div>
              </div>
              <div className="text-xs text-[var(--vscode-descriptionForeground)]">{agent.agentDescription}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentTypeDropdown;
