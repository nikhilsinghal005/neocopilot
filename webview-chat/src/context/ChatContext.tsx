// src/context/ChatContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ChatSession, MessageStore } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextProps {
  chatSession: ChatSession;  // Chat session cannot be null
  setChatSession: React.Dispatch<React.SetStateAction<ChatSession>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  clearChatSession: () => void;
  addMessage: (newMessage: MessageStore) => void;
}

// Default values for a new chat session
const createNewChatSession = (): ChatSession => {
  return {
    chatId: uuidv4(), // Generate unique chatId
    timestamp: new Date().toISOString(),
    chatName: 'New Chat',  // Default chat name, can be customized
    messages: [],          // Initialize with an empty message list
  };
};

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const useChatContext = (): ChatContextProps => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatSession, setChatSession] = useState<ChatSession>(() => {
    // Check if there's an existing session in sessionStorage
    const storedSession = sessionStorage.getItem('chatSession');
    if (storedSession) {
      return JSON.parse(storedSession) as ChatSession;
    }
    // If no session is found, create a new one
    return createNewChatSession();
  });

  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Store the chat session in sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('chatSession', JSON.stringify(chatSession));
  }, [chatSession]);

  // Clears the current chat session and creates a new one
  const clearChatSession = () => {
    const newSession = createNewChatSession();
    setChatSession(newSession);
    console.log(`New chat session created with chatId: ${newSession.chatId}`);
  };

  // Add a new message to the current chat session
  const addMessage = (newMessage: MessageStore) => {
    setChatSession((prevSession) => ({
      ...prevSession,
      messages: [...prevSession.messages, newMessage], // Ensure messages is always an array
    }));
  };

  return (
    <ChatContext.Provider value={{ chatSession, setChatSession, isTyping, setIsTyping, clearChatSession, addMessage }}>
      {children}
    </ChatContext.Provider>
  );
};
