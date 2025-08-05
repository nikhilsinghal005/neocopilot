import React, { createContext, useContext } from 'react';
import { ChatSession, MessageStore, EditorOpenFileList, ChatSessionList, UploadedImage } from '../../../shared/types/Message';
import { v4 as uuidv4 } from 'uuid';

export interface ChatContextProps {
  chatSession: ChatSession;
  setChatSession: React.Dispatch<React.SetStateAction<ChatSession>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  agentType: string;
  setAgentType: React.Dispatch<React.SetStateAction<string>>;
  openEditorFilesList: EditorOpenFileList[];
  setOpenEditorFilesList: React.Dispatch<React.SetStateAction<EditorOpenFileList[]>>;
  clearChatSession: () => void;
  addMessage: (newMessage: MessageStore) => void;
  isInterrupted: boolean;
  setIsInterrupted: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionList: ChatSessionList;
  setChatSessionList:  React.Dispatch<React.SetStateAction<ChatSessionList>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  uploadImage: UploadedImage[];
  setUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;

  // Previous State Input
  previousInput: string;
  setPreviousInput: React.Dispatch<React.SetStateAction<string>>;
  previousAgentType: string;
  setPreviousAgentType: React.Dispatch<React.SetStateAction<string>>;
  previousUploadImage: UploadedImage[];
  setPreviousUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
}

export const createNewChatSession = (): ChatSession => ({
  chatId: uuidv4(),
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  chatName: 'Untitled Chat',
  messages: [],
});

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const useChatContext = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};