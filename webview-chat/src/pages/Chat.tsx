import React, { useEffect } from "react";
import ChatContainer from "../components/Chat/ChatContainer";
import { useChatListener } from "../hooks/useChatListener";
import { v4 as uuidv4 } from "uuid";
import { useChatContext } from "../context/ChatContext";
import { useVscode } from "../context/VscodeContext";

const Chat: React.FC = () => {
  const vscode = useVscode();
  const {
    chatSession,
    setChatSession,
    isTyping,
    setIsTyping,
    input,
    setInput,
  } = useChatContext();

  useEffect(() => {
    const savedState = vscode.getState ? vscode.getState() || {} : {};
    const savedChatSession = savedState.chat || {
      chatId: uuidv4(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      chatName: "Untitled Chat",
      messages: [],
    };
    setChatSession(savedChatSession);
  }, [vscode, setChatSession]);

  useEffect(() => {
    const currentState = vscode.getState?.() || {};
    if (chatSession) {
      vscode.setState?.({ ...currentState, chat: chatSession });
    }
  }, [chatSession, vscode]);  

  useChatListener();

  const handleSendMessage = () => {
    if (!input.trim() || isTyping) return;

    const newMessage = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      messageType: "user" as "user",
      text: input.trim(),
    };

    setChatSession((prevSession) => {
      const updatedMessages = [...(prevSession.messages || []), newMessage];
      const updatedChatSession = { ...prevSession, messages: updatedMessages };

      vscode.postMessage({
        command: "send_chat_message",
        data: updatedChatSession,
      });
      return updatedChatSession;
    });

    setInput("");
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
