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
          // Update the text by appending the new data and update isComplete flag
          messageInProgressRef.current.text += data.response;
          messageInProgressRef.current.isComplete = data.complete;
        }

        setMessages((prevMessages) => {
          if (!messageInProgressRef.current) return prevMessages; // Safety check

          const existingMessage = prevMessages.find(
            (msg) => msg.id === messageInProgressRef.current!.id
          );

          // If the message exists, update it by appending new text, if not complete
          if (existingMessage) {
            // If the existing message is already complete, don't update
            if (existingMessage.isComplete) {
              return prevMessages;
            }

            // Update the existing message
            const updatedMessages = prevMessages.map((msg) =>
              msg.id === messageInProgressRef.current!.id
                ? {
                    ...msg,
                    text: msg.text + data.response,
                    isComplete: data.complete,
                  }
                : msg
            );
            return updatedMessages;
          }

          // If the message doesn't exist, add it to the list
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
