// Import statements remain the same
import * as vscode from 'vscode';
import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { SOCKET_API_BASE_URL } from './config';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';
import { v4 as uuidv4 } from 'uuid';
import { AuthManager } from './authManager/authManager';
import { CodeInsertionManager } from './codeInsertions/CodeInsertionManager';

interface CustomSocketOptions extends Partial<ManagerOptions & SocketOptions> {}

interface UserProfile {
  email: string;
  name: string;
  pictureUrl: string;
}

export class SocketModule {
  private static instance: SocketModule | null = null;
  public socket: Socket | null = null;
  public currentVersion = versionConfig.getCurrentVersion();
  public currentSuggestionId: string = "";
  public rateLimitExceeded: boolean = false;
  private rateLimitTimer: NodeJS.Timeout | null = null;
  private isUpdatePopupShown: boolean = false;
  public startTime: number = performance.now();
  public previousText: string = "";
  public email: string = "";
  private pingInterval: NodeJS.Timeout | null = null;
  private userId: string = "";
  private codeInsertionManager: CodeInsertionManager| null = null;

  constructor() {
  }

  public static getInstance(): SocketModule {
    if (!SocketModule.instance) {

      // // console.log("SocketModule: Creating new instance");
      SocketModule.instance = new SocketModule();
    } else {
      // // console.log("SocketModule: Returning existing instance");
    }
    return SocketModule.instance;
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
    
    // Handle rate limit exceeded
    this.socket.on('rate_limit_exceeded', () => {
      StatusBarManager.updateMessage(`$(check) Neo Copilot`);

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
