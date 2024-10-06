// src/types/message.ts

export type MessageType = 'user' | 'system';

export interface Message {
  id: string; // Unique identifier (UUID)
  timestamp: string; // ISO timestamp
  messageType: MessageType;
  text: string;
}
