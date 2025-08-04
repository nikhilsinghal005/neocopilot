import React, { useState, useEffect, useCallback } from 'react';
import { ChatSession, MessageStore, CurrentFileContext, EditorOpenFileList, ChatSessionList, UploadedImage } from '../../../shared/types/Message';
import { chatModelDetail } from '../../../shared/types/AppDetails';
import { ChatContext, createNewChatSession } from './chatTypes';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
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
  const [chatModel, setChatModel] = useState<string>('');
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
});
