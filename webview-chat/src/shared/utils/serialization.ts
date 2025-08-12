import { ChatSession, MessageStore } from '../types/Message';
import { AgentDetail } from '../types/AppDetails';

export interface SerializedAgent {
  agentId: string;
  agentName: string;
  agentDescription: string;
}

export interface SerializedUploadedImage {
  fileName: string;
  filePath: string;
  fileType: string;
  fileContent: string;
  isActive: boolean;
  isManuallyAddedByUser: boolean;
}

export interface SerializedMessage {
  id: string;
  timestamp: string;
  messageType: 'user' | 'system';
  text: string;
  uploadedImages?: SerializedUploadedImage[];
  selectedAgent?: SerializedAgent; // canonical stripped icon
}

export interface SerializedChatSession {
  chatId: string;
  timestamp: string;
  chatName: string;
  messages: SerializedMessage[];
  createdAt: string;
}

export function serializeAgent(agent?: AgentDetail | null): SerializedAgent | undefined {
  if (!agent) { return undefined; }
  return {
    agentId: agent.agentId,
    agentName: agent.agentName,
    agentDescription: agent.agentDescription,
  };
}

export function serializeMessage(message: MessageStore): SerializedMessage {
  const selectedAgentSource: AgentDetail | undefined = (message as unknown as { selectedAgent?: AgentDetail }).selectedAgent;
  return {
    id: message.id,
    timestamp: message.timestamp,
    messageType: message.messageType,
    text: message.text,
    uploadedImages: message.uploadedImages?.map(img => ({
      fileName: img.fileName,
      filePath: img.filePath,
      fileType: img.fileType,
      fileContent: img.fileContent,
      isActive: img.isActive,
      isManuallyAddedByUser: img.isManuallyAddedByUser
    })),
  selectedAgent: serializeAgent(selectedAgentSource)
  };
}

export function sanitizeChatSession(session: ChatSession): SerializedChatSession {
  return {
    chatId: session.chatId,
    timestamp: session.timestamp,
    chatName: session.chatName,
    createdAt: session.createdAt,
    messages: (session.messages || []).map(serializeMessage)
  };
}
