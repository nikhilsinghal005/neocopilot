// src/pages/Chat.tsx
import React, {useEffect } from 'react';
import ChatContainer from '../features/chat/components/ChatContainer';
import { useChatListener } from '../features/chat/hooks/useChatListener';
import { MessageStore, ChatSession } from '../shared/types/Message';
import { v4 as uuidv4 } from 'uuid';
import { useChatContext } from '../features/chat/state/chatTypes';
import { useVscode } from '../integration/vscode/api';
import { chatModelDetail } from '../shared/types/AppDetails';

const Chat: React.FC = () => {
  const vscode = useVscode();
  const { chatSession, setChatSession, isTyping, setIsTyping, chatModel, attachedContext, input, setInput, setChatModel, setChatModelList, uploadImage } = useChatContext();

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
    // Restore the saved chat model details from session storage
    const storedChatModelDetails = sessionStorage.getItem('chatModelDetails');
    if (!storedChatModelDetails) {return;}

    const parsedChatModelDetails = JSON.parse(storedChatModelDetails) as chatModelDetail[];
    setChatModelList(parsedChatModelDetails);
    // Set the base model as the current chat model
    const baseModelKey = parsedChatModelDetails.find(model => model.isBaseModel)?.modelKey;
    if (!baseModelKey) {return;}
    setChatModel(baseModelKey);
    
  }, [vscode, setChatModel, setChatModelList]);

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
      modelSelected: chatModel,
      attachedContext: attachedContext,
      uploadedImages: uploadImage
    };
    console.log("----------------------" , newMessageStore);
    setChatSession((prevSession: ChatSession) => {
      // Prevent duplicate messages based on ID
      const messageExists = prevSession.messages.some((msg: MessageStore) => msg.id === newMessageStore.id);
      if (messageExists) {return prevSession;}

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
