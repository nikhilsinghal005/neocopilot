// src/types/message.ts

export type MessageType = 'user' | 'system';

export interface Message {
  id: string; // Unique identifier (UUID)
  timestamp: string; // ISO timestamp
  messageType: MessageType;
  text: string;
}

export interface MessageResponse {
  chatId: string;
  id: string;
  response: string;
  isComplete?: boolean; // Indicates if the message is fully received
}

export interface MessageResponseFromBackEnd {
  chatId: string;
  id: string;
  response: string;
  isComplete?: boolean; // Indicates if the message is fully received
  additionalData?: object;
}


export type MessageInput = {
  id: string;
  timestamp: string;
  messageType: 'user' | 'system';
  text: string;
  attachedFiles?: string[];  // List of file paths attached to the message
  imagePaths?: string[];     // List of image paths associated with the message
  isComplete?: boolean; // Indicates if the message is fully received
  attachedContext: CurrentFileContext[];  // List of file paths attached to the message
};

export type CurrentFileContext = {
  currentSelectedFileName: string;
  currentSelectedFileCompletePath: string;
  slectionType: string;
  fileText?: string;
};

export type ChatSession = {
  chatId: string;
  timestamp: string;
  chatName: string;
  messages: MessageInput[];
};