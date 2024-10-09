import React, { useState } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import { useChatListener } from '../hooks/useChatListener';
import { Message } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';

interface ChatProps {
  vscode: {
    postMessage: (msg: any) => void;
  };
}

const Chat: React.FC<ChatProps> = ({ vscode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');
    setIsTyping(true);

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
