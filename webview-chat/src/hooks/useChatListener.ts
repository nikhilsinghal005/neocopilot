// webview-chat/src/hooks/useChatListener.tsx
import { useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { MessageStore, MessageInput, ChatSession } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

export const useChatListener = () => {
  const { chatSession, setChatSession, isTyping, setIsTyping, addMessage } = useChatContext();
  const accumulatedResponseRef = useRef<string>('');
  const messageInProgressRef = useRef<MessageStore | null>(null);
  const isTypingRef = useRef<boolean>(isTyping); // Keep track of the latest isTyping value
  const chatSessionRef = useRef<ChatSession>(chatSession); // Keep track of the latest chatSession

  // Update isTypingRef whenever isTyping changes
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  // Update chatSessionRef whenever chatSession changes
  useEffect(() => {
    chatSessionRef.current = chatSession;
  }, [chatSession]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.command === 'receive_chat_message') {
        const { data }: { data: MessageInput } = event.data;

        // Check if the incoming message's chatId matches the current chat session's chatId
        if (chatSessionRef.current && data.chatId !== chatSessionRef.current.chatId) {
          console.log(`Received message for a different chat session. Ignoring. chatSession.chatId: ${chatSessionRef.current.chatId}`);
          
          // Explicitly reset the accumulator and messageInProgress when chatId doesn't match
          accumulatedResponseRef.current = '';
          messageInProgressRef.current = null;
          
          return;
        }

        if (!isTypingRef.current) {
          console.log("Received but not processing because typing is false");
          return;
        }

        // Accumulate partial responses
        accumulatedResponseRef.current += data.response;

        // If this is the first chunk, create a new message object
        if (!messageInProgressRef.current) {
          messageInProgressRef.current = {
            id: data.id !== 'unknown' ? data.id : uuidv4(),
            timestamp: new Date().toISOString(),
            messageType: 'system',
            text: accumulatedResponseRef.current,
            isComplete: data.isComplete,
          };
        } else {
          // Update the text by appending the new data and update isComplete flag
          messageInProgressRef.current.text += data.response;
          messageInProgressRef.current.isComplete = data.isComplete;
        }

        // Ensure messageInProgressRef.current is not null
        if (!messageInProgressRef.current) {
          return;
        }

        setChatSession((prevSession) => {
          if (!prevSession) {
            return {
              chatId: data.chatId,
              timestamp: new Date().toISOString(),
              chatName: 'New Chat',
              messages: [messageInProgressRef.current!],
            };
          }

          const existingMessage = prevSession.messages.find(
            (msg) => msg.id === messageInProgressRef.current!.id
          );

          // If the message exists, update it
          if (existingMessage) {
            if (existingMessage.isComplete) {
              return prevSession;
            }

            const updatedMessages = prevSession.messages.map((msg) =>
              msg.id === messageInProgressRef.current!.id
                ? {
                    ...msg,
                    text: msg.text + data.response,
                    isComplete: data.isComplete,
                  }
                : msg
            );

            return { ...prevSession, messages: updatedMessages };
          }

          // If the message doesn't exist, add it to the session
          return {
            ...prevSession,
            messages: [...prevSession.messages, { ...messageInProgressRef.current! }],
          };
        });

        // Once the response is complete, reset and update typing state
        if (data.isComplete) {
          setIsTyping(false);

          setTimeout(() => {
            accumulatedResponseRef.current = ''; 
            messageInProgressRef.current = null;
          }, 0);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setChatSession, setIsTyping]);

};
