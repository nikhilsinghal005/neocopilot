import React, { useState, useEffect } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import { useChatListener } from '../hooks/useChatListener';
import { Message, MessageOuput } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '../context/ChatContext';

interface ChatProps {
  vscode: {
    postMessage: (msg: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  };
}

const Chat: React.FC<ChatProps> = ({ vscode }) => {
  const { messages, setMessages } = useChatContext();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const savedMessages = vscode.getState ? vscode.getState() : null;
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, [vscode, setMessages]);

  useEffect(() => {
    vscode.setState(messages);
  }, [messages, vscode]);

  useChatListener(setMessages, setIsTyping);

  const handleSendMessage = () => {
    if (input.trim() === '' || isTyping) return;

    const newMessage: MessageOuput = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    vscode.postMessage({
      command: 'send_chat_message',
      data: newMessage,
    });
  };

  return (
    <ChatContainer
      input={input}
      setInput={setInput}
      isTyping={isTyping}
      handleSendMessage={handleSendMessage}
    />
  );
};

export default Chat;
