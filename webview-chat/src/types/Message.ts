  // src/types/Message.ts
  export type ChatData = {
    chatId: string;
    timestamp: string;
    messages: MessageStore[];
  };

  // // For input messages (e.g., when receiving or sending new messages)
  // export type MessageInput = {
  //   chatId: string;
  //   id: string;
  //   timestamp: string;
  //   messageType: 'user' | 'system';
  //   response: string;
  //   isComplete?: boolean; // Indicates if the message is fully received
  // };

  export type CurrentFileContext = {
    currentSelectedFileName: string;
    currentSelectedFileRelativePath: string;
    slectionType: string;
    isCurrentlyOpen: boolean;
    isUserSelected: boolean;
  };

  // For input messages (e.g., when receiving or sending new messages)
  export type MessageInput = {
    chatId: string;
    id: string;
    timestamp: string;
    messageType: 'system';
    response: string;
    isComplete?: boolean; // Indicates if the message is fully received
  };

  export type EditorOpenFileList = {
    fileName: string;
    filePath: string;
    languageId: string;
  };

  export type MessageOutput = {
    id: string;
    timestamp: string;
    messageType: 'user';
    text: string;
    isComplete?: boolean; // Indicates if the message is fully received
    modelSelected: string; // Indicates the model used to generate the response
    attachedContext: CurrentFileContext[];  // List of file paths attached to the message
  };

  // How a message is stored with additional details like files and images
  export type MessageStore = {
    id: string;
    timestamp: string;
    messageType: 'user' | 'system';
    text: string;
    attachedFiles?: object[];  // List of file paths attached to the message
    imagePaths?: string[];     // List of image paths associated with the message
    isComplete?: boolean; // Indicates if the message is fully received
    modelSelected?: string; // Indicates the model used to generate the response
    attachedContext?: object[];  // List of file paths attached to the message
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
