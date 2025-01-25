// src/chatProvider/aiChatPanelSocketHandler.ts
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, MessageResponse, MessageResponseFromBackEnd } from './types/messageTypes';
import { AiChatPanel } from './aiChatPanel';
import * as vscode from 'vscode';
import { getFileText } from '../utilities/editorUtils/getFileText';

export class AiChatMessageHandler {
  private socketModule: SocketModule;
  private messageQueue: MessageResponse[] = [];
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();
  private currentChatModel: string = "neo-1";

  constructor(
    private aiChatPanel: AiChatPanel,
    private authManager: AuthManager,
    private context: vscode.ExtensionContext
  ) {
    this.socketModule = SocketModule.getInstance();
  }

  // Add this function inside your class
  public initializeWebviewListener(webviewView: vscode.WebviewView) {
    // Check if this is the first time adding the listener for the current active panel
    if (!this.webviewListeners.has(this.aiChatPanel.activePanels[0])) {
      this.webviewListeners.add(webviewView);

      // Handle messages received from the webview
      webviewView.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.command) {
          // Handles sending a chat message
          case 'send_chat_message':
            const inputChat: ChatSession = message.data;
            this.attemptSendChatMessage(inputChat);
            break;
        }
      });
    }
  }

  /**
   * Initialize the socket connection and attach listeners.
   */
  public initializeSockets(): void {
    this.socketModule = SocketModule.getInstance();
    this.attachSocketListeners();
    if (this.messageQueue.length > 0) {
      this.messageQueue.forEach(data => {
        this.postMessageToWebview(this.aiChatPanel.activePanels[0], data);
      });
      this.messageQueue = [];
    }
    // Making sure the socket is connected everytime socket connects.
    this.socketModule.socket?.on('connect', () => {
      console.log("Socket connected. Attaching listeners for Chat messages.");
      this.attachSocketListeners();
    });
  }

  /**
   * Attempt to establish a socket connection with retries.
   * @param inputChat The chat session data to send.
   * @param retries Number of remaining retries.
   */
  public attemptSendChatMessage(inputChat: ChatSession, retries = 3): void {
    this.socketModule = SocketModule.getInstance();
    if (this.socketModule.socket?.connected) {
      console.log("Socket connected. Attaching listeners for Chat messages.");
      this.attachSocketListeners();
      this.sendChatMessage(inputChat);
    } else if (retries > 0) {
      setTimeout(() => {
        this.attemptSendChatMessage(inputChat, retries - 1);
      }, 5000);
    } else {
      this.forwardMessageToWebviews({
        chatId: inputChat.chatId,
        id: uuidv4(),
        response: "Please check your internet connection or try again.",
        isComplete: true,
      });
    }
  }

  /**
   * Attach necessary socket listeners.
   */
  private attachSocketListeners(): void {
    console.log("Attaching listeners for Chat messages.");
    if (this.socketModule.socket?.listeners('receive_chat_response').length === 0) {
      console.log("Attaching listeners for Chat messages.");
      this.socketModule.socket?.on('receive_chat_response', (data: MessageResponseFromBackEnd) => {
        this.forwardMessageToWebviews(data);
      });
    }
  
    if (this.socketModule.socket?.listeners('typing_indicator').length === 0) {
      console.log("Attaching listeners for Chat messages.");
      this.socketModule.socket?.on('typing_indicator', (data: any) => {
        this.postTypingIndicatorMessageToWebview(this.aiChatPanel.activePanels[0], data.processingState);
      });
    }
  }

  private postTypingIndicatorMessageToWebview(webviewView: vscode.WebviewView, processingState: string): void {
    try {
      // // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
      webviewView.webview.postMessage({
        command: 'chat_response_state_info',
        data: {
          inputState: processingState
        }
      });
    } catch (error) {
      console.error("Failed to post queued message to webview");
    }
  }

  private postMessageToWebview(webviewView: vscode.WebviewView, data: MessageResponse): void {
    try {
      // // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
      webviewView.webview.postMessage({
        command: 'receive_chat_message',
        data: {
          chatId: data.chatId,
          response: data.response,
          unique_id: data.id,
          isComplete: data.isComplete,
          modelSelected: this.currentChatModel
        }
      });
    } catch (error) {
      console.error("Failed to post queued message to webview");
    }
  }

  public forwardMessageToWebviews(data: MessageResponseFromBackEnd): void {
    if (this.aiChatPanel.activePanels.length > 0) {
      if (this.messageQueue.length > 0) {
        this.messageQueue.forEach(q_data => {
          this.postMessageToWebview(this.aiChatPanel.activePanels[0], q_data);
        });
        this.messageQueue = [];
      }

      this.aiChatPanel.activePanels.forEach(panel => {
        try {
          panel.webview.postMessage({
            command: 'receive_chat_message',
            data: {
              chatId: data.chatId,
              response: data.response,
              id: data.id,
              isComplete: data.isComplete,
              modelSelected: this.currentChatModel
            }
          });
        } catch (error) {
          console.error("Failed to post message to webview");
        }
      });
    } else {
      this.messageQueue.push(data);
    }
  }

  public async sendChatMessage(chat: ChatSession) {

    let messageList = chat.messages.slice(-5);

    // Process each message in the list
    const lastMessage = messageList[messageList.length - 1];
    this.currentChatModel = lastMessage.modelSelected; 
    
    if (lastMessage && lastMessage.attachedContext?.length > 0) {
        for (const contextTemp of lastMessage.attachedContext) {
            try {
                // Retrieve and update fileText for the current context
                console.log("context", contextTemp.filePath)
                const fileText = await getFileText(contextTemp.filePath );
                contextTemp.fileText = fileText || '';
            } catch (error) {
                console.error(`Failed to fetch file text for ${contextTemp.filePath}:`, error);
                contextTemp.fileText = '';
            }
        }
    }
    messageList[-1] = lastMessage

    // Emit the updated messageList to the socket
    if (this.socketModule.socket) {
      this.socketModule.socket.emit('generate_chat_response', {
            chatId: chat.chatId,
            timestamp: chat.timestamp,
            messageList, // Updated with fileText for all messages
            appVersion: this.socketModule.currentVersion,
            userEmail: this.socketModule.email,
            uniqueId: uuidv4()
        });
    }
  }
}
