import React from 'react';
import {
  VSCodeDropdown,
  VSCodeOption,
} from '@vscode/webview-ui-toolkit/react';
import { useChatContext } from '../../../features/chat/state/chatTypes';

const AgentTypeDropdown: React.FC = () => {
  const { agentType, setAgentType, isTyping } = useChatContext();

  const agentTypes = ['ask', 'agent'];

  return (
    <VSCodeDropdown
      value={agentType}
      disabled={isTyping}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange={(e: any) => setAgentType(e.target.value)}
      className="w-auto"
    >
      {agentTypes.map((type) => (
        <VSCodeOption key={type} value={type} className="text-xxs">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};

export default AgentTypeDropdown;
