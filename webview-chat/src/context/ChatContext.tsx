import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ChatSession, MessageStore, CurrentFileContext, EditorOpenFileList, ChatSessionList, UploadedImage } from '../types/Message';
import { chatModelDetail } from '../types/AppDetails';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextProps {
  chatSession: ChatSession;
  setChatSession: React.Dispatch<React.SetStateAction<ChatSession>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
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
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  uploadImage: UploadedImage[];
  setUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;

  // Previous State Input
  previousInput: string;
  setPreviousInput: React.Dispatch<React.SetStateAction<string>>;
  previousChatModel: string;
  setPreviousChatModel: React.Dispatch<React.SetStateAction<string>>;
  previousAttachedContext: CurrentFileContext[];
  setPreviousAttachedContext: React.Dispatch<React.SetStateAction<CurrentFileContext[]>>;
  previousUploadImage: UploadedImage[];
  setPreviousUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
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
        console.error('Failed to parse stored chat session:', error);
      }
    }
    return createNewChatSession();
  });
  

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [chatModel, setChatModel] = useState<string>('neo-7');
  const [previousChatModel, setPreviousChatModel] = useState<string>('neo-7');
  const [attachedContext, setAttachedContext] = useState<CurrentFileContext[]>([]);
  const [previousAttachedContext, setPreviousAttachedContext] = useState<CurrentFileContext[]>([]);
  const [openEditorFilesList, setOpenEditorFilesList] = useState<EditorOpenFileList[]>([]);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const [chatModelList, setChatModelList] = useState<chatModelDetail[]>([]);
  const [chatSessionList, setChatSessionList] = useState<ChatSessionList>([]);
  const [input, setInput] = useState<string>(''); // Add input state here
  const [previousInput, setPreviousInput] = useState<string>(''); // Add input state here
  const [uploadImage, setUploadImage] = useState<UploadedImage[]>([]);
  const [previousUploadImage, setPreviousUploadImage] = useState<UploadedImage[]>([]);

  useEffect(() => {
    sessionStorage.setItem('chatSession', JSON.stringify(chatSession));
  }, [chatSession]);

  const clearChatSession = useCallback(() => {
    if (chatSession.messages.length > 0) {
      let chatNameToSet = 'Untitled Chat';
      const firstUserMessage = chatSession.messages.find(msg => msg.messageType === 'user');
      if (firstUserMessage) {
        chatNameToSet = firstUserMessage.text.substring(0, 100);
      }

      setChatSessionList((prev) => {
        const updatedList = prev.filter(session => session.chatId !== chatSession.chatId);

        const newList = [
          { ...chatSession, chatName: chatNameToSet },
          ...updatedList,
        ];

        return newList.slice(0, 10);
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
        isTyping,
        setIsTyping,
        chatModel,
        setChatModel,

        attachedContext,
        setAttachedContext,
        openEditorFilesList,
        setOpenEditorFilesList,
        clearChatSession,
        addMessage,
        isInterrupted,
        setIsInterrupted,
        chatModelList,
        setChatModelList,
        chatSessionList,
        setChatSessionList,
        input,
        setInput, // Provide input state here
        isEditing,
        setIsEditing,
        uploadImage,
        setUploadImage,

        previousInput,
        setPreviousInput,
        previousChatModel,
        setPreviousChatModel,
        previousAttachedContext,
        setPreviousAttachedContext,
        previousUploadImage,
        setPreviousUploadImage,

      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
