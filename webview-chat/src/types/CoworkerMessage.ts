export type CoworkerData = {
  coworkerId: string;
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
  fileContent: string;
  isActive: boolean;
  isManuallyAddedByUser: boolean;
};

// For input messages (e.g., when receiving or sending new messages)
export type MessageInput = {
  coworkerId: string;
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
  attachedFiles?: object[];
  uploadedImages?: UploadedImage[]  // List of file paths attached to the message
  imagePaths?: string[];     // List of image paths associated with the message
  isComplete?: boolean; // Indicates if the message is fully received
  modelSelected?: string; // Indicates the model used to generate the response
  attachedContext?: CurrentFileContext[];  // List of file paths attached to the message
  useInternet?: boolean;
  isProblemsSelected?: boolean;
  isTerminalSelected?: boolean;
};

// Represents a full coworker session with a name and list of messages
export type CoworkerSession = {
  coworkerId: string;
  timestamp: string;
  coworkerName: string;
  messages: MessageStore[];
  createdAt: string;
};

export type CoworkerListType = {
  coworkerId: string;
  timestamp: string;
  coworkerName: string;
};

export type CoworkerList = CoworkerListType[];

export type CoworkerSessionList = CoworkerSession[];
