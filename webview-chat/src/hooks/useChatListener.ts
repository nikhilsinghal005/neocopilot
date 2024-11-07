import { useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { MessageStore, MessageInput, ChatSession } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

export const useChatListener = () => {
  const { chatSession, setChatSession, isTyping, setIsTyping } = useChatContext();
  const accumulatedResponseRef = useRef<string>('');
  const messageInProgressRef = useRef<MessageStore | null>(null);
  const isTypingRef = useRef<boolean>(isTyping);
  const chatSessionRef = useRef<ChatSession | null>(chatSession);

  // Sync refs with current state
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { chatSessionRef.current = chatSession; }, [chatSession]);

  useEffect(() => {
    const handleIncomingMessage = (event: MessageEvent) => {
      if (event.data.command === 'receive_chat_message') {
        processMessage(event.data);
      }
    };

    const processMessage = (eventData: { data: MessageInput }) => {
      const { data } = eventData;
      try {
        if (!isValidMessage(data)) return;

        accumulateResponse(data);
        updateSessionWithMessage(data);

        if (data.isComplete) finalizeMessage();
      } catch (error) {
        console.error("Error updating chat message in useChatListener:", error);
      }
    };

    const isValidMessage = (data: MessageInput) => {
      if (!chatSessionRef.current?.chatId) {
        console.warn("No valid chatId found; ignoring message.");
        return false;
      }
      if (data.chatId !== chatSessionRef.current.chatId) {
        console.warn(`Message chatId mismatch: expected ${chatSessionRef.current.chatId}, received ${data.chatId}`);
        resetMessageProgress();
        return false;
      }
      // if (!isTypingRef.current) {
      //   console.warn("Received message ignored because typing is false.");
      //   return false;
      // }
      return true;
    };

    const accumulateResponse = (data: MessageInput) => {
      accumulatedResponseRef.current += data.response;

      if (!messageInProgressRef.current) {
        messageInProgressRef.current = {
          id: data.id !== 'unknown' ? data.id : uuidv4(),
          timestamp: new Date().toISOString(),
          messageType: 'system',
          text: accumulatedResponseRef.current,
          isComplete: data.isComplete,
        };
        console.log("Created new messageInProgress:", messageInProgressRef.current);
      } else {
        messageInProgressRef.current.text += data.response;
        messageInProgressRef.current.isComplete = data.isComplete;
        console.log("Updated messageInProgress:", messageInProgressRef.current);
      }
    };

    const updateSessionWithMessage = (data: MessageInput) => {
      setChatSession((prevSession) => {
        if (!prevSession) {
          console.warn("Previous session is null, creating a new one.");
          return createNewSession(data.chatId);
        }

        if (!messageInProgressRef.current) {
          console.error("messageInProgressRef is null during updateSessionWithMessage. This should not happen.");
          return prevSession;
        }

        const existingMessageIndex = prevSession.messages.findIndex(
          (msg) => msg.id === messageInProgressRef.current!.id
        );

        let updatedMessages;
        if (existingMessageIndex !== -1) {
          if (data.id === 'unknown') {
            console.warn("Received message part with unknown ID; removing this part.");
            return prevSession; // Ignore this specific part if the ID is 'unknown'
          }
          updatedMessages = prevSession.messages.map((msg, index) =>
            index === existingMessageIndex
              ? {
                  ...msg,
                  text: msg.text + data.response,
                  isComplete: data.isComplete,
                }
              : msg
          );
        } else {
          if (data.id === 'unknown') {
            console.warn("Received message part with unknown ID; ignoring.");
            return prevSession; // Ignore the message part if the ID is 'unknown'
          }
          updatedMessages = [...prevSession.messages, { ...messageInProgressRef.current }];
        }

        console.log("Updating chat session with messages:", updatedMessages);
        return { ...prevSession, messages: updatedMessages };
      });
    };

    const createNewSession = (chatId: string): ChatSession => ({
      chatId,
      timestamp: new Date().toISOString(),
      chatName: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: messageInProgressRef.current ? [messageInProgressRef.current] : [],
    });

    const resetMessageProgress = () => {
      console.log("Resetting message progress");
      accumulatedResponseRef.current = '';
      messageInProgressRef.current = null;
    };

    const finalizeMessage = () => {
      console.log("Finalizing message");
      setIsTyping(false);
      setTimeout(resetMessageProgress, 0);
    };

    window.addEventListener('message', handleIncomingMessage);
    return () => window.removeEventListener('message', handleIncomingMessage);
  }, [setChatSession, setIsTyping]);
};
