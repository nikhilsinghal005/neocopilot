// src/types/message.ts

export type MessageType = 'user' | 'system';

export interface Message {
  id: string; // Unique identifier (UUID)
  timestamp: string; // ISO timestamp
  messageType: MessageType;
  text: string;
}

export interface MessageResponse {
  coworkerId: string;
  id: string;
  response: string;
  isComplete?: boolean; // Indicates if the message is fully received
}

export interface MessageResponseFromBackEnd {
  coworkerId: string;
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
  modelSelected: string;
};

  export type CurrentFileContext = {
    fileName: string;
    filePath: string;
    languageId: string;
    isActive: boolean;
    isOpened: boolean;
    isSelected: boolean;
    isAttachedInContextList: boolean;
    isManuallyAddedByUser: boolean;
    fileText?: string;
  };

export type CoworkerSession = {
  coworkerId: string;
  timestamp: string;
  coworkerName: string;
  messages: MessageInput[];
};

export interface smartInsert {
  uniqueId: string, 
  uniqueCoworkerId: string, 
  editorCode: string, 
  updatedCode: string,
  actionType: string
}
