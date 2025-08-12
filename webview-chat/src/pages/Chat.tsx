// src/pages/Chat.tsx
import React, {useEffect } from 'react';
import ChatContainer from '../features/chat/components/ChatContainer';
import { useChatListener } from '../features/chat/hooks/useChatListener';
import { MessageStore, ChatSession } from '../shared/types/Message';
import { sanitizeChatSession } from '../shared/utils/serialization';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '../features/chat/state/chatTypes';
import { useVscode } from '../integration/vscode/api';
import Settings from './Settings';

const Chat: React.FC = () => {
  const vscode = useVscode();
  const { chatSession, setChatSession, isTyping, setIsTyping, agentType, input, setInput, uploadImage, currentView } = useChatContext();

  useEffect(() => {
    // Restore the saved chat session from VSCode state
    const chatSession = sessionStorage.getItem('chatSession');
    if (chatSession) {
      const parsedChatSession = JSON.parse(chatSession) as ChatSession;
      setChatSession({
        ...parsedChatSession,
        chatId: parsedChatSession.chatId || uuidv4(),
        chatName: parsedChatSession.chatName || 'Untitled Chat',
        messages: parsedChatSession.messages || [],
        createdAt: parsedChatSession.createdAt || new Date().toISOString(),
        timestamp: parsedChatSession.timestamp || new Date().toISOString(),
      });
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
    if (input.trim() === '' || isTyping) {return;}

    const newMessageStore: MessageStore = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: 'user',
      text: input.trim(),
      selectedAgent: agentType,
      uploadedImages: uploadImage
    };
    
    setChatSession((prevSession: ChatSession) => {
      // Prevent duplicate messages based on ID
      const messageExists = prevSession.messages.some((msg: MessageStore) => msg.id === newMessageStore.id);
      if (messageExists) {return prevSession;}

      const updatedMessages = [...(prevSession.messages || []), newMessageStore];
      const updatedChatSession = { ...prevSession, messages: updatedMessages };

      // Sanitize before sending to avoid DataCloneError (strip React nodes/functions)
      const serializedSession = sanitizeChatSession(updatedChatSession as ChatSession);
      vscode.postMessage({
        command: 'send_chat_message',
        data: {
          chatSession: serializedSession,
          selectedAgent: {
            agentId: agentType.agentId,
            agentName: agentType.agentName,
            agentDescription: agentType.agentDescription,
          },
          userMessage: {
            text: input.trim(),
            images: uploadImage.map(img => ({
              fileName: img.fileName,
              filePath: img.filePath,
              fileType: img.fileType,
              fileContent: img.fileContent,
              isActive: img.isActive,
              isManuallyAddedByUser: img.isManuallyAddedByUser
            }))
          },
          timestamp: new Date().toISOString()
        }
      });

      return updatedChatSession;
    });

    setInput('');
    setIsTyping(true);
  };

  if (currentView === 'settings') {
    return <Settings />;
  }

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
