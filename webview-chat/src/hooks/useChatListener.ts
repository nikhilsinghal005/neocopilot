import { useEffect, useRef } from 'react';
import { Message } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

export const useChatListener = (
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const accumulatedResponseRef = useRef<string>('');
  const messageInProgressRef = useRef<Message | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.command === 'receive_chat_message') {
        const { data } = event.data;

        // Accumulate partial responses
        accumulatedResponseRef.current += data.response;

        // If this is the first chunk, create a new message object
        if (!messageInProgressRef.current) {
          messageInProgressRef.current = {
            id: data.unique_id !== 'unknown' ? data.unique_id : uuidv4(),
            timestamp: new Date().toISOString(),
            messageType: 'system',
            text: accumulatedResponseRef.current,
            isComplete: data.complete,
          };
        } else {
          // Update the text and isComplete flag in the message object
          messageInProgressRef.current.text = accumulatedResponseRef.current;
          messageInProgressRef.current.isComplete = data.complete;
        }

        // Update the state with the current message
        setMessages((prevMessages) => {
          if (!messageInProgressRef.current) return prevMessages; // Safety check

          const existingIndex = prevMessages.findIndex(
            (msg) => msg.id === messageInProgressRef.current!.id
          );
          if (existingIndex !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[existingIndex] = { ...messageInProgressRef.current };
            return updatedMessages;
          }
          return [...prevMessages, { ...messageInProgressRef.current }];
        });

        // Once the response is complete, reset and update typing state
        if (data.complete) {
          setIsTyping(false); // Ensure isTyping is set to false when complete

          // Delay the reset to ensure the last state update occurs
          setTimeout(() => {
            accumulatedResponseRef.current = ''; // Clear the accumulator
            messageInProgressRef.current = null; // Reset message-in-progress reference
          }, 0);
        }
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setMessages, setIsTyping]);
};
