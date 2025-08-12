import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../../features/chat/state/chatTypes';
import { AgentDetail } from '../../../shared/types/AppDetails';
import { ChevronDown, HelpCircle, Bot } from 'lucide-react';

const AgentTypeDropdown: React.FC = () => {
  const { agentType, setAgentType, isTyping } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const agentTypes: AgentDetail[] = [
    {
      agentId: 'ask',
      agentName: 'Ask',
      agentDescription: 'Your general-purpose assistant for a wide range of tasks.',
      icon: <HelpCircle size={16} />,
    },
    {
      agentId: 'agent',
      agentName: 'Agent',
      agentDescription: 'A specialized agent for more complex, multi-step tasks.',
      icon: <Bot size={16} />,
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTyping}
        className="w-full flex items-center justify-between px-1 py-0 text-left bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-sm"
      >
        <div className="flex items-center gap-2">
          {agentType.icon}
          <span>{agentType.agentName}</span>
        </div>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-1 w-56 bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded-sm shadow-lg z-10">
          {agentTypes.map((agent) => (
            <div
              key={agent.agentId}
              onClick={() => {
                setAgentType(agent);
                setIsOpen(false);
              }}
              className="px-2 py-1 hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer"
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
