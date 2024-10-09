// src/pages/Chat.tsx
import React, { useState, useEffect } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import { useChatListener } from '../hooks/useChatListener';
import { Message } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

interface ChatProps {
  vscode: {
    postMessage: (msg: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}

const Chat: React.FC<ChatProps> = ({ vscode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Retrieve messages from VS Code state on mount
  useEffect(() => {
    const savedMessages = vscode.getState ? vscode.getState() : null;
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, [vscode]);

  // Custom hook to handle incoming messages
  useChatListener(setMessages, setIsTyping);

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    // Save messages to state
    vscode.setState(updatedMessages);

    vscode.postMessage({
      command: 'send_chat_message',
      data: newMessage,
    });
  };

  return (
    <ChatContainer
      messages={messages}
      input={input}
      setInput={setInput}
      isTyping={isTyping}
      handleSendMessage={handleSendMessage}
    />
  );
};

export default Chat;