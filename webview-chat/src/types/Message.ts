export type ChatData = {
  chatId: string;
  timestamp: string;
  messages: MessageStore[];
};

export type CurrentFileContext = {
  fileName: string;
  filePath: string;
  languageId: string;
  isActive: boolean;
  isOpened: boolean;
  isSelected: boolean;
  isAttachedInContextList: boolean;
  isManuallyAddedByUser: boolean;
};

export type UploadedImage = {
  fileName: string;
  filePath: string;
  fileType: string;
  isActive: boolean;
  isManuallyAddedByUser: boolean;
};

// For input messages (e.g., when receiving or sending new messages)
export type MessageInput = {
  chatId: string;
  id: string;
  timestamp: string;
  messageType: 'system';
  response: string;
  isComplete?: boolean; // Indicates if the message is fully received
  modelSelected: string; // Indicates the model used to generate the response
};

export type EditorOpenFileList = {
  fileName: string;
  filePath: string;
  languageId: string;
  isActive: boolean;
  isOpened: boolean;
  isSelected: boolean;
};

export type MessageOutput = {
  id: string;
  timestamp: string;
  messageType: 'user';
  text: string;
  isComplete?: boolean; // Indicates if the message is fully received
  modelSelected: string; // Indicates the model used to generate the response
  attachedContext: CurrentFileContext[];  // List of file paths attached to the message
  useInternet: boolean;
  isProblemsSelected: boolean;
  isTerminalSelected: boolean;
  uploadedImages: UploadedImage[];
};

// How a message is stored with additional details like files and images
export type MessageStore = {
  id: string;
  timestamp: string;
  messageType: 'user' | 'system';
  text: string;
  attachedFiles?: object[];  // List of file paths attached to the message
  uploadedImages?: UploadedImage[];     // List of image paths associated with the message
  isComplete?: boolean; // Indicates if the message is fully received
  modelSelected?: string; // Indicates the model used to generate the response
  attachedContext?: CurrentFileContext[];  // List of file paths attached to the message
  useInternet?: boolean;
  isProblemsSelected?: boolean;
  isTerminalSelected?: boolean;
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

export type ChatSessionList = ChatSession[];
