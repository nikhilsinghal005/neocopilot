  // src/types/Message.ts
  export type ChatData = {
    chatId: string;
    timestamp: string;
    messages: MessageStore[];
  };

  // For input messages (e.g., when receiving or sending new messages)
  export type MessageInput = {
    chatId: string;
    id: string;
    timestamp: string;
    messageType: 'user' | 'system';
    response: string;
    isComplete?: boolean; // Indicates if the message is fully received
  };

  // How a message is stored with additional details like files and images
  export type MessageStore = {
    id: string;
    timestamp: string;
    messageType: 'user' | 'system';
    text: string;
    attachedFiles?: string[];  // List of file paths attached to the message
    imagePaths?: string[];     // List of image paths associated with the message
    isComplete?: boolean; // Indicates if the message is fully received
  };

  // Represents a full chat session with a name and list of messages
  export type ChatSession = {
    chatId: string;
    timestamp: string;
    chatName: string;
    messages: MessageStore[];
    createdAt: string;
  };

  export type ChatListType = {
    chatId: string;
    timestamp: string;
    chatName: string;
  };

  export type ChatList = ChatListType[];
