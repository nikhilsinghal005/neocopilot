// Import statements remain the same
import * as vscode from 'vscode';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { SOCKET_API_BASE_URL } from './config';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';
import { v4 as uuidv4 } from 'uuid';
import {
  handleAddedSpecialCharacters,
  findFirstMatch,
  searchSuggestion,
} from "./utilities/codeCompletionUtils/completionUtils";
import { getTextBeforeCursor } from "./utilities/codeCompletionUtils/editorCodeUtils";
import { AuthManager } from './authManager/authManager';
import { CodeInsertionManager } from './codeInsertions/CodeInsertionManager';
import { ChatSession, MessageInput} from './chatProvider/types/messageTypes';

interface CustomSocketOptions extends Partial<ManagerOptions & SocketOptions> {}

interface UserProfile {
  email: string;
  name: string;
  pictureUrl: string;
}

export class SocketModule {
  private static instance: SocketModule | null = null;
  public socket: Socket | null = null;
  public socketListSuggestion: string[] = [];
  public suggestion: string = "";
  private tempSuggestion: string = "";
  public completionProvider: CompletionProviderModule;
  public predictionRequestInProgress = false;
  public predictionWaitText = "";
  private tempUniqueIdentifier: string = "NA";
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentVersion = versionConfig.getCurrentVersion();
  public currentSuggestionId: string = "";
  public rateLimitExceeded: boolean = false;
  private rateLimitTimer: NodeJS.Timeout | null = null;
  private isUpdatePopupShown: boolean = false;
  public isSuggestionRequired: boolean = true;
  private deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
  public startTime: number = performance.now();
  public previousText: string = "";
  private email: string = "";
  private pingInterval: NodeJS.Timeout | null = null;
  private userId: string = "";
  private codeInsertionManager: CodeInsertionManager| null = null;
  private docstring: string = "";
  private docstringData: { [key: string]: { 
      id: string;
      location: { line: number; character: number } 
    }} = {};

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
  }

  public static getInstance(completionProvider?: CompletionProviderModule): SocketModule {
    if (!SocketModule.instance) {
      if (!completionProvider) {
        throw new Error("SocketModule has not been initialized yet. Please provide a CompletionProviderModule.");
      }
      // console.log("SocketModule: Creating new instance");
      SocketModule.instance = new SocketModule(completionProvider);
    } else {
      // console.log("SocketModule: Returning existing instance");
    }
    return SocketModule.instance;
  }

  public reinitializeSocket(): void {
    this.predictionRequestInProgress = false;
    this.isSuggestionRequired = true;
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.completionProvider.updateSuggestion("");
  }

  public async connect(appVersion: string, context: vscode.ExtensionContext): Promise<Socket | null> {
    if (this.socket) {
      return this.socket;
    }
    this.codeInsertionManager = CodeInsertionManager.getInstance(context);
    const authManager = new AuthManager(context);
    const userProfile = await authManager.getUserProfile();

    if (userProfile && (await authManager.getAccessToken())) {
      this.email = userProfile.email;
      this.userId = userProfile.userId
    } else {
      StatusBarManager.initializeLogoutStatusBar(context);
      authManager.clearTokens();
      return null;
    }

    this.socket = await createSocketConnection(appVersion, this.email, this.userId, authManager);

    // Register event handlers
    this.registerSocketEventHandlers(context, authManager);

    return this.socket;
  }

  private registerSocketEventHandlers(context: vscode.ExtensionContext, authManager: AuthManager) {
    if (!this.socket) return;

    // Handle successful connection
    this.socket.on('connect', () => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
      }
      console.info(`%c[${new Date().toLocaleTimeString()}] Neo Copilot: Securely connected with server`, 'color: green;');
      this.reinitializeSocket();

      // Start ping interval to keep the connection alive
      this.pingInterval = setInterval(async () => {
        if (this.socket && this.socket.connected) {
          const tokenIsVerified = await authManager.verifyAccessToken();

          if (tokenIsVerified) {
            this.socket.emit('ping');
            // console.info(`%c[${new Date().toLocaleTimeString()}] Neo Copilot: Connection alive`, 'color: green;');
          } else {
            this.socket.disconnect();
            StatusBarManager.registerBeforeLoginCommand(context);
            authManager.clearTokens();
            this.socket = null;
          }
        }
      }, 4 * 60 * 1000); // Ping every 4 minutes
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
      }
      console.error(`[${new Date().toLocaleTimeString()}] Neo Copilot: disconnected from Server`);
      this.reinitializeSocket();
      // No manual reconnection; Socket.IO handles it
    });

    // Handle connection errors
    this.socket.on('connect_error', async (err) => {
      console.error(`[${new Date().toLocaleTimeString()}] Neo Copilot: Socket connection error`);

      if (err.message.includes('Authentication error')) {
        await sleep(5000)
        const tokenIsVerified = await authManager.verifyAccessToken();
    
        if (tokenIsVerified) {
          // Disconnect the current socket
          if (this.socket) {
            this.socket.off(); // Remove event listeners
            this.socket.disconnect();
            this.socket = null;
          }

          // Create a new socket with the updated token
          this.socket = await createSocketConnection(this.currentVersion, this.email, this.userId, authManager);
    
          // Register event handlers
          this.registerSocketEventHandlers(context, authManager);
        } else {
          // Token refresh failed; prompt user to log in again
          StatusBarManager.initializeLogoutStatusBar(context);
          authManager.clearTokens();
          if (this.socket) {
            this.socket.io.opts.autoConnect = false; // Stop automatic reconnections
            this.socket.disconnect();
          }
          this.socket = null;
        }
      }
    });
    

    // Handle receiving messages
    this.socket.on('receive_message', (data: any) => {
      try {
        this.predictionRequestInProgress = false;
        StatusBarManager.updateMessage(`$(check) Neo Copilot`);
        console.info(`%cNeo Copilot: prediction completion time: ${(performance.now() - this.startTime).toFixed(2)} milliseconds`, 'color: green;');
        if (this.isSuggestionRequired) {
          this.predictionHandleFunction(data);
        } else {
          this.completionProvider.updateSuggestion("");
          this.triggerInlineSuggestion();
          this.isSuggestionRequired = true;
        }
      } catch (error) {
        this.customInformationMessage('socket_module:receive_message', JSON.stringify(error));
      }
    });

    // Handle rate limit exceeded
    this.socket.on('rate_limit_exceeded', () => {
      StatusBarManager.updateMessage(`$(check) Neo Copilot`);
      this.reinitializeSocket();

      vscode.window.showWarningMessage("Rate limit exceeded. Please try after 15 minutes.", "OK");

      if (this.rateLimitTimer) {
        clearTimeout(this.rateLimitTimer);
      }

      this.rateLimitTimer = setTimeout(() => {
        this.rateLimitExceeded = false;
      }, 15 * 60 * 1000); // 15 minutes
    });

    // Handle app version updates
    this.socket.on('update_app_version', (data: any) => {
      if (this.isUpdatePopupShown) {
        return;
      } else {
        const extensionId = data.extension_id;
        const newRequiredVersion = data.latest_version;
        this.promptUpdate(extensionId, newRequiredVersion, data.message);
        this.isUpdatePopupShown = true;
      }
    });

    // Add any other necessary event handlers here
    this.socket.on('receive_docstring', (data: any) => {
      this.predictionRequestInProgress = false;
      try {
        const docstring = data.docstring;
        const docstring_id = data.unique_id;
        if (data.complete){
          this.docstring = this.docstring +  data.docstring
          if (this.codeInsertionManager){
            this.codeInsertionManager.insertTextUsingSnippetLocation(this.docstring, data.unique_id, this.docstringData[docstring_id].location);
          }
          this.docstring = ""
        }else{
          this.docstring = this.docstring +  data.docstring
          // console.log(this.docstring)
        }

      } catch (error) {
        this.predictionRequestInProgress = false;

        this.customInformationMessage('socket_module:receive_message', JSON.stringify(error));
        this.docstring = ""
      }
    });

  }

  public emitDocstringFunction(uuid: string, input_code: string, language: string, location: { line: number; character: number }) {
    this.predictionRequestInProgress = true;
    this.docstringData[uuid] = {id: uuid, location: location}
    if (this.rateLimitExceeded) {
      this.reinitializeSocket();
      return;
    }
    // console.log("UUID for docstring", uuid)
    // StatusBarManager.updateMessage(`$(loading~spin) Neo Copilot`);
    if (this.socket) {
      const timestamp = new Date().toISOString();
      this.socket.emit('generate_docstring', {
        uuid,
        input_code,
        language,
        appVersion: this.currentVersion,
        userEmail: this.email
      });
    }
  }

  public sendChatMessage(chat: ChatSession) {
    // console.log("Message to scoket from backend")
    this.predictionRequestInProgress = true;
    // const messageList: MessageInput = chat.messages;
    // const timestamp = new Date().toISOString();
    // const messageType = chat.messageType;
    if (this.socket) {
      this.socket.emit('generate_chat_response', {
        chatId: chat.chatId,
        timestamp: chat.timestamp,
        messageList: chat.messages.slice(-6),
        appVersion: this.currentVersion,
        userEmail: this.email,
        uniqueId: uuidv4()
      });
    }
  }

  public emitMessage(uuid: string, prefix: string, suffix: string, inputType: string, language: string) {
    // console.log("Sending Message for Completion")
    this.predictionRequestInProgress = true;

    if (this.rateLimitExceeded) {
      this.reinitializeSocket();
      return;
    }

    this.suggestion = "";
    this.socketListSuggestion = [];
    this.completionProvider.updateSuggestion("");
    StatusBarManager.updateMessage(`$(loading~spin) Neo Copilot`);
    this.tempUniqueIdentifier = uuid;

    if (this.socket) {
      const timestamp = new Date().toISOString();
      this.socket.emit('send_message', {
        prefix,
        suffix,
        inputType,
        uuid,
        appVersion: this.currentVersion,
        language,
        timestamp,
        userEmail: this.email,
      });
    }
    this.previousText = prefix;
    // console.log("Sending Message for Completion", uuid)

  }

  public chatCompletionMessage(completion_type: string, completion_comment: string, completion_size: number) {
    if (this.rateLimitExceeded) {
      return;
    }

    if (this.socket) {
      this.socket.emit('completion_accepted', {
        uuid: this.currentSuggestionId,
        completion_type,
        completion_comment,
        completion_size,
        userEmail: this.email,
      });
    }
  }

  public customInformationMessage(information_type: string, information_comment: string) {
    if (this.rateLimitExceeded) {
      return;
    }

    if (this.socket) {
      this.socket.emit('custom_information', {
        uuid: uuidv4(),
        information_type,
        information_comment,
        userEmail: this.email,
      });
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.off(); // Remove all event listeners
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private triggerInlineSuggestion() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
      }
    }, 10);
  }

  private promptUpdate(extensionId: string, newRequiredVersion: string, inpputMessage: string) {
    vscode.window
      .showWarningMessage(
        inpputMessage,
        'Update Now'
      )
      .then((selection: string | undefined) => {
        if (selection === 'Update Now') {
          this.customInformationMessage('update_app_button_clicked', `User clicked on update button to update the app to ${newRequiredVersion}`);
          this.openExtensionInMarketplace(extensionId);
        }
      });
  }

  private openExtensionInMarketplace(extensionId: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`vscode:extension/${extensionId}`));
  }

  private predictionHandleFunction(predictionReceived: any): void {
    // console.log("Recieved Message for Completion", predictionReceived.unique_Id)
    // console.log("Recieved Message for Completion", predictionReceived.message_list)
    if (predictionReceived.message && this.tempUniqueIdentifier === predictionReceived.unique_Id) {
      if (getTextBeforeCursor(vscode.window.activeTextEditor) === this.previousText + this.predictionWaitText) {
        this.currentSuggestionId = predictionReceived.unique_Id;
        this.suggestion = predictionReceived.message;
        this.socketListSuggestion = predictionReceived.message_list;

        if (this.predictionWaitText) {
          if (this.suggestion.startsWith(this.predictionWaitText)) {
            this.completionProvider.updateSuggestion(this.suggestion.substring(this.predictionWaitText.length));
            this.chatCompletionMessage("partial_completion", 'prediction_wait_feature', this.predictionWaitText.length);
            this.predictionWaitText = "";
          } else if (findFirstMatch(this.socketListSuggestion, this.suggestion, this.predictionWaitText)) {
            [this.suggestion, this.tempSuggestion] = searchSuggestion(
              this.socketListSuggestion,
              this.previousText,
              getTextBeforeCursor(vscode.window.activeTextEditor),
              this.predictionWaitText
            );
            this.completionProvider.updateSuggestion(this.tempSuggestion);
            this.predictionWaitText = "";
            this.chatCompletionMessage("partial_completion", 'prediction_wait_feature', this.predictionWaitText.length);
          } else if (this.deleteSpecialCharacters.includes(this.predictionWaitText)) {
            this.completionProvider.updateSuggestion(
              handleAddedSpecialCharacters(this.suggestion, this.suggestion, this.predictionWaitText)
            );
          } else {
            this.suggestion = "";
            this.socketListSuggestion = [];
            this.completionProvider.updateSuggestion(this.suggestion);
          }
        } else {
          this.completionProvider.updateSuggestion(this.suggestion);
        }
      } else {
        // Cursor position changed; do nothing
      }

      this.triggerInlineSuggestion();
    }
  }
}
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to create the socket connection
async function createSocketConnection(appVersion: string, email: string, userId: string, authManager: any): Promise<Socket> {
  const options = {
    query: {
      appVersion: appVersion,
      userEmail: email,
      userId: userId
    },
    transports: ['websocket', 'polling'], // Allow both transports
    credentials: true,
    reconnection: true,
    secure: true,
    // reconnectionAttempts: 10000,
    // reconnectionDelay: 10000,
    // reconnectionDelayMax: 10000,
    // timeout: 10000,
    extraHeaders: {
      Authorization: `Bearer ${await authManager.getAccessToken()}`,
    },
  };

  // Create and return the socket connection
  const socket = io(SOCKET_API_BASE_URL, options);
  return socket;
}
