import React, { useState, useRef, useEffect } from 'react';
import { MessageStore } from '../../types/Message';
import { AgentDetail } from '../../types/AppDetails';
import { ChevronDown, HelpCircle, Bot } from 'lucide-react';

interface AgentTypeSelectDropdownProps {
  message: MessageStore;
  handleRefresh: (messageId: string, agent: AgentDetail) => void;
}

const AgentTypeSelectDropdown: React.FC<AgentTypeSelectDropdownProps> = ({
  message,
  handleRefresh,
}) => {
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
    <div className="relative w-32" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-1 py-0 text-left bg-[var(--vscode-input-background)] text-[var(--vscode-input-foreground)] border border-[var(--vscode-input-border)] rounded-sm"
      >
        <div className="flex items-center gap-2">
          {message.selectedAgent?.icon}
          <span>{message.selectedAgent?.agentName || 'Select Agent'}</span>
        </div>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full mb-1 w-56 bg-[var(--vscode-input-background)] border border-[var(--vscode-input-border)] rounded-sm shadow-lg z-10">
          {agentTypes.map((agent) => (
            <div
              key={agent.agentId}
              onClick={() => {
                handleRefresh(message.id, agent);
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

export default AgentTypeSelectDropdown;