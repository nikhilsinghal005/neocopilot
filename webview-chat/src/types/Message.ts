// src/types/Message.ts
export type Message = {
  id: string;
  timestamp: string;
  messageType: 'user' | 'system';
  text: string;
  isComplete?: boolean; // Indicates if the message is fully received
};
