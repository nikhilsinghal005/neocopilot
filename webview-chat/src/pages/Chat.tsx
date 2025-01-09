// src/pages/Chat.tsx
import React, { useState, useEffect } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import { useChatListener } from '../hooks/useChatListener';
import { MessageStore, MessageOutput } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '../context/ChatContext';
import { useVscode } from '../context/VscodeContext';

const Chat: React.FC = () => {
  const vscode = useVscode();
  const { chatSession, setChatSession, isTyping, setIsTyping, chatModel, attachedContext, input, setInput } = useChatContext();

  useEffect(() => {
    // Restore the saved chat session from VSCode state
    const savedState = vscode.getState ? vscode.getState() : {};

    const savedChatSession = savedState.chat || null;
    if (savedChatSession) {
      setChatSession(savedChatSession);
    }
  }, [vscode, setChatSession]);

  useEffect(() => {
    // Save the chat session in VSCode state
    const currentState = vscode.getState() || {};
    if (chatSession) {
      vscode.setState({ ...currentState, chat: chatSession });
    }
  }, [chatSession, vscode]);

  useChatListener();

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
        command: 'send_chat_message',
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

export default Chat;
