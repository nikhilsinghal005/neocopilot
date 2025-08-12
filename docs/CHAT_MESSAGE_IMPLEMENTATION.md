# Chat Message Implementation

This document outlines the implementation of the `send_chat_message` command that captures and logs comprehensive information when a user sends a message from the input bar.

## Overview

When a user presses the send button in the chat interface, the system now captures:
1. Selected model information
2. User message content and uploaded images
3. Current editor context (selected code, file information)
4. API key availability status

## Implementation Details

### Frontend Changes (webview-chat)

#### Chat.tsx
- **File**: `webview-chat/src/pages/Chat.tsx`
- **Changes**: Updated `handleSendMessage` function to send comprehensive data structure
- **New Data Structure**:
```typescript
{
  command: 'send_chat_message',
  data: {
    chatSession: ChatSession,
    selectedModel: AgentDetail,
    userMessage: {
      text: string,
      uploadedImages: UploadedImage[]
    },
    timestamp: string
  }
}
```

### Backend Changes (extension)

#### AiChatPanel.ts
- **File**: `src/features/chat/aiChatPanel.ts`
- **New Handler**: Added `send_chat_message` case in message handler
- **New Methods**:
  - `checkApiKeyAccess()`: Checks for OpenAI and Azure API keys
  - `getEditorContext()`: Gathers comprehensive editor information
  - `maskApiKey()`: Safely masks API keys for logging

#### New Type Definitions
```typescript
interface SendChatMessageData {
  chatSession: ChatSession;
  selectedModel: AgentDetail;
  userMessage: {
    text: string;
    uploadedImages: UploadedImage[];
  };
  timestamp: string;
}

interface AgentDetail {
  agentId: string;
  agentName: string;
  agentDescription: string;
  icon: unknown;
}

interface ChatSession {
  chatId: string;
  chatName: string;
  messages: unknown[];
  timestamp: string;
  createdAt: string;
}
```

## Logged Information

When a message is sent, the following information is logged:

### 1. Chat Session Data
- Chat ID
- Chat name
- Message count

### 2. Selected Model
- Agent ID (e.g., "ask", "code", etc.)
- Agent name
- Agent description

### 3. User Message
- Message text content
- Timestamp
- Uploaded images count
- Whether images are attached

### 4. Editor Context
- File name of active editor
- Programming language ID
- Whether text is selected
- Selected text length and content
- Cursor position (line, character)
- Total lines and characters in file
- Selection range (start/end positions)

### 5. API Configuration
- OpenAI API key availability
- Azure API key availability
- Masked preview of keys (for debugging)
- Key lengths

## Code Structure

```
src/features/chat/
├── aiChatPanel.ts          # Main chat panel handler
└── aiChatContextHandler.ts # Context handling utilities

webview-chat/src/
├── pages/Chat.tsx          # Main chat component
└── features/chat/
    ├── state/chatTypes.ts  # Type definitions
    └── components/         # Chat UI components
```

## API Key Access

The system checks for API keys stored in VS Code's secure storage:
- `neoCopilot.secret.openai.apiKey`
- `neoCopilot.secret.azure.apiKey`

Keys are masked in logs for security (e.g., "sk-a***xy (len=51)")

## Next Steps

This implementation provides the foundation for:
1. AI response generation using the captured context
2. Code-aware conversations
3. Multi-modal chat with image support
4. Secure API key management

The logging structure is now in place to help debug and understand the data flow when implementing the actual AI processing pipeline.

## Testing

To test the implementation:
1. Open a file in VS Code
2. Select some code (optional)
3. Open the Neo Copilot chat panel
4. Type a message and press send
5. Check the VS Code Developer Console for logged information

The logs will show all captured data in a structured format for debugging purposes.
