// webview-chat/src/pages/Chat.tsx
import React, { useState, useEffect } from 'react';
import ChatContainer from '../components/Chat/ChatContainer';
import ChatControls from '../components/Chat/ChatControls';
import { useChatListener } from '../hooks/useChatListener';
import { MessageOuput } from '../types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '../context/ChatContext';
import { useVscode } from '../context/VscodeContext';

const Chat: React.FC = () => {
  const vscode = useVscode();
  const { messages, setMessages, isTyping, setIsTyping } = useChatContext();
  const [input, setInput] = useState('');

  useEffect(() => {
    const savedMessages = vscode.getState ? vscode.getState() : null;
    if (savedMessages) {
      setMessages(savedMessages);
    }
  }, [vscode, setMessages]);

  useEffect(() => {
    vscode.setState(messages);
  }, [messages, vscode]);

  useChatListener();

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
