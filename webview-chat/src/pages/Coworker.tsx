// src/pages/Coworker.tsx
import React, { useState, useEffect } from 'react';
import ChatContainer from '../components/Coworker/ChatContainer';
import { useCoworkerListener } from '../hooks/useCoworkerListener';
import { MessageStore, MessageOutput } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useCoworkerContext } from '../context/CoworkerContext';
import { useVscode } from '../context/VscodeContext';

const Coworker: React.FC = () => {
  const vscode = useVscode();
  const { chatSession, setChatSession, isTyping, setIsTyping, chatModel, attachedContext } = useCoworkerContext();
  const [input, setInput] = useState('');

  useEffect(() => {
    // Restore the saved chat session from VSCode state
    const savedChatSession = vscode.getState ? vscode.getState() : null;
    if (savedChatSession) {
      setChatSession(savedChatSession);
    }
  }, [vscode, setChatSession]);

  useEffect(() => {
    // Save the chat session in VSCode state
    if (chatSession) {
      vscode.setState(chatSession);
    }
  }, [chatSession, vscode]);

  useCoworkerListener();

  const handleSendMessage = () => {
    if (input.trim() === '' || isTyping) return;

    const newMessageStore: MessageStore = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
      modelSelected: chatModel,
      attachedContext: attachedContext
    };
    console.log("----------------------" , newMessageStore);
    setChatSession((prevSession) => {
      // Prevent duplicate messages based on ID
      const messageExists = prevSession.messages.some(msg => msg.id === newMessageStore.id);
      if (messageExists) return prevSession;

      const updatedMessages = [...(prevSession.messages || []), newMessageStore];
      const updatedChatSession = { ...prevSession, messages: updatedMessages };

      vscode.postMessage({
        command: 'send_coworker_message',
        data: updatedChatSession,
      });

      return updatedChatSession;
    });

    setInput('');
    setIsTyping(true);
  };

  return (
    <div>
      <ChatContainer
        input={input}
        setInput={setInput}
        isTyping={isTyping}
        handleSendMessage={handleSendMessage}

      />
    </div>
  );
};

export default Coworker;
