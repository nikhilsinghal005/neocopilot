// src/hooks/useChatListener.ts
import { useEffect, useRef } from 'react';
import { Message } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

export const useChatListener = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const accumulatedResponseRef = useRef<string>('');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.command === 'receive_chat_message') {
        const { data } = event.data;
        accumulatedResponseRef.current += data.response;

        const receivedMessage: Message = {
          id: data.unique_id !== 'unknown' ? data.unique_id : uuidv4(),
          timestamp: new Date().toISOString(),
          messageType: 'system',
          text: accumulatedResponseRef.current,
        };

        setMessages((prevMessages) => {
          const existingIndex = prevMessages.findIndex((msg) => msg.id === receivedMessage.id);
          if (existingIndex !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[existingIndex] = receivedMessage;
            return updatedMessages;
          }
          return [...prevMessages, receivedMessage];
        });

        if (data.complete) {
          accumulatedResponseRef.current = ''; 
          setIsTyping(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setMessages, setIsTyping]);
};
