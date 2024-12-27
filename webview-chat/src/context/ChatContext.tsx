import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ChatSession, MessageStore, CurrentFileContext, EditorOpenFileList, ChatSessionList } from '../types/Message';
import { chatModelDetail } from '../types/AppDetails';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextProps {
  chatSession: ChatSession;
  setChatSession: React.Dispatch<React.SetStateAction<ChatSession>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  chatModel: string;
  setChatModel: React.Dispatch<React.SetStateAction<string>>;
  attachedContext: CurrentFileContext[],
  setAttachedContext: React.Dispatch<React.SetStateAction<CurrentFileContext[]>>;
  openEditorFilesList: EditorOpenFileList[];
  setOpenEditorFilesList: React.Dispatch<React.SetStateAction<EditorOpenFileList[]>>;
  clearChatSession: () => void;
  addMessage: (newMessage: MessageStore) => void;
  isInterrupted: boolean;
  setIsInterrupted: React.Dispatch<React.SetStateAction<boolean>>;
  chatModelList: chatModelDetail[];
  setChatModelList: React.Dispatch<React.SetStateAction<chatModelDetail[]>>;
  chatSessionList: ChatSessionList;
  setChatSessionList:  React.Dispatch<React.SetStateAction<ChatSessionList>>;
}

const createNewChatSession = (): ChatSession => ({
  chatId: uuidv4(),
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  chatName: 'Untitled Chat',
  messages: [],
});

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
    const storedSession = sessionStorage.getItem('chatSession');
    if (storedSession) {
      try {
        return JSON.parse(storedSession) as ChatSession;
      } catch (error) {
        console.error("Failed to parse stored chat session:", error);
        return createNewChatSession();
      }
    }else{
      const newSession: ChatSession = createNewChatSession();
      sessionStorage.setItem('chatSession', JSON.stringify(newSession));
      return newSession;
    }
  });

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatModel, setChatModel] = useState<string>('neo-7');
  const [attachedContext, setAttachedContext] = useState<CurrentFileContext[]>([]);
  const [openEditorFilesList, setOpenEditorFilesList] = useState<EditorOpenFileList[]>([]);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const [chatModelList, setChatModelList] = useState<chatModelDetail[]>([]);
  const [chatSessionList, setChatSessionList] = useState<ChatSessionList>([]);

  
  useEffect(() => {
    sessionStorage.setItem('chatSession', JSON.stringify(chatSession));
  }, [chatSession]);

  const clearChatSession = useCallback(() => {
    if (chatSession.messages.length > 0) { // Check if there are any messages
      let chatNameToSet = 'Untitled Chat';
      const firstUserMessage = chatSession.messages.find(msg => msg.messageType === 'user');
      if (firstUserMessage) {
        chatNameToSet = firstUserMessage.text.substring(0, 100);
      }
  
      setChatSessionList((prev) => {
        // Filter out the session with the same chatId
        const updatedList = prev.filter(session => session.chatId !== chatSession.chatId);
  
        // Add the new session and limit the list size to 10
        const newList = [
          { ...chatSession, chatName: chatNameToSet },
          ...updatedList,
        ];
  
        return newList.slice(0, 10); // Keep only the latest 10 sessions
      });
    }
    
    const newSession = createNewChatSession();
    sessionStorage.setItem('chatSession', JSON.stringify(newSession));
    setChatSession(newSession);
  }, [chatSession, setChatSessionList]);
  
  
  const addMessage = useCallback((newMessage: MessageStore) => {
    setChatSession((prevSession) => ({
      ...prevSession,
      messages: [...prevSession.messages, newMessage],
    }));
  }, []);

  return (
    <ChatContext.Provider 
      value={{
        chatSession, 
        setChatSession, 
        isTyping, setIsTyping, 
        chatModel, setChatModel,
        attachedContext, setAttachedContext,
        openEditorFilesList, setOpenEditorFilesList,
        clearChatSession, 
        addMessage,
        isInterrupted, setIsInterrupted,
        chatModelList, setChatModelList,
        chatSessionList, setChatSessionList,
      }}>
      {children}
    </ChatContext.Provider>
  );
};
