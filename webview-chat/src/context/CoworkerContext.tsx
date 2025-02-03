import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { CoworkerSession, MessageStore, CurrentFileContext, EditorOpenFileList, CoworkerSessionList,UploadedImage } from '../types/CoworkerMessage';
import { chatModelDetail } from '../types/AppDetails';
import { v4 as uuidv4 } from 'uuid';

interface CoworkerContextProps {
  coworkerSession: CoworkerSession;
  setCoworkerSession: React.Dispatch<React.SetStateAction<CoworkerSession>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  coworkerModel: string;
  setCoworkerModel: React.Dispatch<React.SetStateAction<string>>;
  attachedContext: CurrentFileContext[],
  setAttachedContext: React.Dispatch<React.SetStateAction<CurrentFileContext[]>>;
  openEditorFilesList: EditorOpenFileList[];
  setOpenEditorFilesList: React.Dispatch<React.SetStateAction<EditorOpenFileList[]>>;
  clearCoworkerSession: () => void;
  addMessage: (newMessage: MessageStore) => void;
  isInterrupted: boolean;
  setIsInterrupted: React.Dispatch<React.SetStateAction<boolean>>;
  coworkerModelList: chatModelDetail[];
  setCoworkerModelList: React.Dispatch<React.SetStateAction<chatModelDetail[]>>;
  coworkerSessionList: CoworkerSessionList;
  setCoworkerSessionList: React.Dispatch<React.SetStateAction<CoworkerSessionList>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  uploadImage: UploadedImage[];
  setUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;

  // Previous State Input
  previousInput: string;
  setPreviousInput: React.Dispatch<React.SetStateAction<string>>;
  previousAttachedContext: CurrentFileContext[];
  setPreviousAttachedContext: React.Dispatch<React.SetStateAction<CurrentFileContext[]>>;
  previousUploadImage: UploadedImage[];
  setPreviousUploadImage: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  
}

const createNewCoworkerSession = (): CoworkerSession => ({
  coworkerId: uuidv4(),
  timestamp: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  coworkerName: 'Untitled Coworker',
  messages: [],
});

const CoworkerContext = createContext<CoworkerContextProps | undefined>(undefined);

export const useCoworkerContext = (): CoworkerContextProps => {
  const context = useContext(CoworkerContext);
  if (!context) {
    throw new Error('useCoworkerContext must be used within a CoworkerProvider');
  }
  return context;
};

export const CoworkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coworkerSession, setCoworkerSession] = useState<CoworkerSession>(() => {
    const storedSession = sessionStorage.getItem('coworkerSession');
    if (storedSession) {
      try {
        return JSON.parse(storedSession) as CoworkerSession;
      } catch (error) {
        console.error("Failed to parse stored coworker session:", error);
        return createNewCoworkerSession();
      }
    } else {
      const newSession: CoworkerSession = createNewCoworkerSession();
      sessionStorage.setItem('coworkerSession', JSON.stringify(newSession));
      return newSession;
    }
  });

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [coworkerModel, setCoworkerModel] = useState<string>('neo-7');
  const [attachedContext, setAttachedContext] = useState<CurrentFileContext[]>([]);
  const [openEditorFilesList, setOpenEditorFilesList] = useState<EditorOpenFileList[]>([]);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const [coworkerModelList, setCoworkerModelList] = useState<chatModelDetail[]>([]);
  const [coworkerSessionList, setCoworkerSessionList] = useState<CoworkerSessionList>([]);
  const [input, setInput] = useState<string>(''); // Add input state here
  const [previousInput, setPreviousInput] = useState<string>(''); // Add input state here
  const [uploadImage, setUploadImage] = useState<UploadedImage[]>([]);
  const [previousUploadImage, setPreviousUploadImage] = useState<UploadedImage[]>([]);
  const [previousAttachedContext, setPreviousAttachedContext] = useState<CurrentFileContext[]>([]);
  

  useEffect(() => {
    sessionStorage.setItem('coworkerSession', JSON.stringify(coworkerSession));
  }, [coworkerSession]);

  const clearCoworkerSession = useCallback(() => {
    if (coworkerSession.messages.length > 0) { // Check if there are any messages
      let coworkerNameToSet = 'Untitled Coworker';
      const firstUserMessage = coworkerSession.messages.find(msg => msg.messageType === 'user');
      if (firstUserMessage) {
        coworkerNameToSet = firstUserMessage.text.substring(0, 100);
      }

      setCoworkerSessionList((prev) => {
        // Filter out the session with the same coworkerId
        const updatedList = prev.filter(session => session.coworkerId !== coworkerSession.coworkerId);

        // Add the new session and limit the list size to 10
        const newList = [
          { ...coworkerSession, coworkerName: coworkerNameToSet },
          ...updatedList,
        ];

        return newList.slice(0, 10); // Keep only the latest 10 sessions
      });
    }

    const newSession = createNewCoworkerSession();
    sessionStorage.setItem('coworkerSession', JSON.stringify(newSession));
    setCoworkerSession(newSession);
  }, [coworkerSession, setCoworkerSessionList]);

  const addMessage = useCallback((newMessage: MessageStore) => {
    setCoworkerSession((prevSession) => ({
      ...prevSession,
      messages: [...prevSession.messages, newMessage],
    }));
  }, []);

  return (
    <CoworkerContext.Provider 
      value={{
        coworkerSession, 
        setCoworkerSession, 
        isTyping, setIsTyping, 
        coworkerModel, setCoworkerModel,
        attachedContext, setAttachedContext,
        openEditorFilesList, setOpenEditorFilesList,
        clearCoworkerSession, 
        addMessage,
        isInterrupted, setIsInterrupted,
        coworkerModelList, setCoworkerModelList,
        coworkerSessionList, setCoworkerSessionList,
        input,
        setInput, // Provide input state here
        isEditing,
        setIsEditing,
        uploadImage,
        setUploadImage,

        previousInput,
        setPreviousInput,
        previousAttachedContext,
        setPreviousAttachedContext,
        previousUploadImage,
        setPreviousUploadImage,
      }}>
      {children}
    </CoworkerContext.Provider>
  );
};
