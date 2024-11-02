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
      if (!isTypingRef.current) {
        console.warn("Received message ignored because typing is false.");
        return false;
      }
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
      } else {
        messageInProgressRef.current.text += data.response;
        messageInProgressRef.current.isComplete = data.isComplete;
      }
    };

    const updateSessionWithMessage = (data: MessageInput) => {
      setChatSession((prevSession) => {
        if (!prevSession) return createNewSession(data.chatId);

        const existingMessage = prevSession.messages.find(
          (msg) => msg.id === messageInProgressRef.current!.id
        );

        const updatedMessages = existingMessage
          ? updateExistingMessage(prevSession, data)
          : [...prevSession.messages, { ...messageInProgressRef.current! }];

        return { ...prevSession, messages: updatedMessages };
      });
    };

    const createNewSession = (chatId: string): ChatSession => ({
      chatId,
      timestamp: new Date().toISOString(),
      chatName: 'New Chat',
      createdAt: new Date().toISOString(),
      messages: [messageInProgressRef.current!],
    });

    const updateExistingMessage = (prevSession: ChatSession, data: MessageInput) => {
      return prevSession.messages.map((msg) =>
        msg.id === messageInProgressRef.current!.id
          ? {
              ...msg,
              text: msg.text + data.response,
              isComplete: data.isComplete,
            }
          : msg
      );
    };

    const resetMessageProgress = () => {
      accumulatedResponseRef.current = '';
      messageInProgressRef.current = null;
    };

    const finalizeMessage = () => {
      setIsTyping(false);
      setTimeout(resetMessageProgress, 0);
    };

    window.addEventListener('message', handleIncomingMessage);
    return () => window.removeEventListener('message', handleIncomingMessage);
  }, [setChatSession, setIsTyping]);
};
