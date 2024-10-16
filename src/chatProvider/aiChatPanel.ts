// webview-chat/src/aiChatPanel.ts

import * as vscode from 'vscode';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { Message, MessageResponse } from './types/messageTypes';
import { v4 as uuidv4 } from 'uuid';
import { getNonce } from '../utilities/chatUtilities';

export class AiChatPanel implements vscode.WebviewViewProvider {
  public static readonly primaryViewType = 'aiChatPanelPrimary';
  public static readonly secondaryViewType = 'aiChatPanelSecondary';
  private static primaryInstance: AiChatPanel;
  private static secondaryInstance: AiChatPanel;

  // Store active (visible) webviews
  private activePanels: vscode.WebviewView[] = [];
  private socketModule: SocketModule;
  private isInPrimary: boolean = true;

  // Flags to prevent multiple listeners
  private socketListenerAdded: boolean = false;
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();

  // Message Queue to store incoming messages when no webviews are active
  private messageQueue: MessageResponse[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _authManager: AuthManager,
    private readonly viewType: string
  ) {
    this.socketModule = SocketModule.getInstance();
  }

  public static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    authManager: AuthManager,
    viewType: string
  ): AiChatPanel {
    if (viewType === AiChatPanel.primaryViewType) {
      if (!AiChatPanel.primaryInstance) {
        AiChatPanel.primaryInstance = new AiChatPanel(extensionUri, context, authManager, viewType);
      }
      return AiChatPanel.primaryInstance;
    } else {
      if (!AiChatPanel.secondaryInstance) {
        AiChatPanel.secondaryInstance = new AiChatPanel(extensionUri, context, authManager, viewType);
      }
      return AiChatPanel.secondaryInstance;
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    console.log("Webview View is being resolved.");

    // Add the webview to activePanels if it's initially visible
    if (webviewView.visible) {
      this.activePanels.push(webviewView);
      console.log(`Webview added to activePanels. Active panels count: ${this.activePanels.length}`);
    }

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        console.log("Webview is now visible.");
        // Add to activePanels if not already present
        if (!this.activePanels.includes(webviewView)) {
          this.activePanels.push(webviewView);
          console.log(`Webview added to activePanels. Active panels count: ${this.activePanels.length}`);
        }

        // // Send any queued messages
        // if (this.messageQueue.length > 0) {
        //   console.log(`Sending ${this.messageQueue.length} queued message(s) to the webview.`);
        //   this.messageQueue.forEach(data => {
        //     this.postMessageToWebview(webviewView, data);
        //   });
        //   // Clear the queue after sending
        //   this.messageQueue = [];
        //   console.log("Message queue cleared.");
        // }
      } else {
        console.log("Webview is now hidden.");
        // Remove from activePanels
        this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
        console.log(`Webview removed from activePanels. Active panels count: ${this.activePanels.length}`);
      }
    });

    // Remove the webview from the activePanels list when it's disposed (if it ever gets disposed)
    webviewView.onDidDispose(() => {
      console.log("Webview disposed.");
      this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
      console.log(`Active panels after disposal: ${this.activePanels.length}`);
    });

    // Allow scripts in the webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui'),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Prevent adding multiple listeners to the same webview
    if (!this.webviewListeners.has(webviewView)) {
      this.webviewListeners.add(webviewView);

      // Listen for messages from the webview
      webviewView.webview.onDidReceiveMessage(async (message: any) => {
        console.log("Received message from webview:", message);
        switch (message.command) {
          case 'send_chat_message':
            // send normal chat message
            if (this.socketModule.socket?.connected===true){
              const sanitizedMessage = this.sanitizeMessage(message.data);
              if (sanitizedMessage) {
                this.socketModule.sendChatMessage(
                  uuidv4(),
                  sanitizedMessage.timestamp,
                  sanitizedMessage.messageType,
                  sanitizedMessage.text
                );
              }
            }else{
              this.socketModule = SocketModule.getInstance();
              const sanitizedMessage = this.sanitizeMessage(message.data);
              if (sanitizedMessage) {
                this.socketModule.sendChatMessage(
                  uuidv4(),
                  sanitizedMessage.timestamp,
                  sanitizedMessage.messageType,
                  sanitizedMessage.text
                );
              }
            }
            


            break;
          case 'login':
            // Handle the login command and open the URL
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            break;

          case 'ready':
            console.log("Received 'ready' message from webview.");
            // Webview signals it's ready; send authentication status
            const isAlreadyLoggedIn = this._context.workspaceState.get('isLoggedIn', false);
            if (!isAlreadyLoggedIn) {
              const isLoggedIn = await this._authManager.verifyAccessToken();
              this.sendAuthStatus(isLoggedIn);

              if (isLoggedIn) {
                this.socketModule = SocketModule.getInstance();
                if (!this.socketListenerAdded) {
                  this.socketModule.socket?.on('receive_chat_response', (data: MessageResponse) => {
                    console.log("Response recived from backend")
                    this.forwardMessageToWebviews(data);
                  });
                  this.socketListenerAdded = true;
                }
              }
            }

            // Send any queued messages
            if (this.messageQueue.length > 0) {
              console.log(`Sending ${this.messageQueue.length} queued message(s) to the webview.`);
              this.messageQueue.forEach(data => {
                this.postMessageToWebview(webviewView, data);
              });
              // Clear the queue after sending
              this.messageQueue = [];
              console.log("Message queue cleared.");
            }

            break;
          default:
            vscode.window.showInformationMessage(`Unknown command: ${message.command}`);
        }
      });
    }

    // Initial sending of queued messages if the webview is visible
    if (this.messageQueue.length > 0 && webviewView.visible) {
      console.log(`Sending ${this.messageQueue.length} queued message(s) to the webview.`);
      this.messageQueue.forEach(data => {
        this.postMessageToWebview(webviewView, data);
      });
      // Clear the queue after sending
      this.messageQueue = [];
      console.log("Message queue cleared.");
    }
  }

  /**
   * Sanitizes incoming messages to prevent security vulnerabilities.
   * @param data - The message data to sanitize.
   * @returns The sanitized message or null if invalid.
   */
  private sanitizeMessage(data: Message): Message | null {
    try {
      console.info("Sanatizing user requested chat");
      const sanitized: Message = {
        id: data.id.trim(),
        timestamp: new Date(data.timestamp).toISOString(),
        messageType: data.messageType,
        text: data.text.trim(),
      };

      return sanitized;
    } catch (error) {
      console.log("Message Sanitization Failed:", error);
      console.error("Message Sanitization Failed");
      return null;
    }
  }

  /**
   * Sends the authentication status to all active aiChatPanel webviews.
   * @param isLoggedIn - Boolean indicating if the user is logged in.
   */
  public sendAuthStatus(isLoggedIn: boolean): void {
    console.log(`Sending authStatus (${isLoggedIn}) to ${this.activePanels.length} panel(s).`);

    // Save the logged-in status in workspace state
    this._context.workspaceState.update('isLoggedIn', isLoggedIn);

    this.activePanels.forEach(panel => {
      panel.webview.postMessage({ command: 'authStatus', isLoggedIn });
    });
  }

  /**
   * Forwards incoming chat messages from the backend to all active webviews.
   * If no webviews are active, the message is queued.
   * @param data - The chat message data received from the backend.
   */
  public forwardMessageToWebviews(data: MessageResponse): void {
    // console.log(`forwardMessageToWebviews called. Active panels count: ${this.activePanels.length}`);
    
    if (this.activePanels.length > 0) {
      if (this.messageQueue.length > 0) {
        console.log("Count of messsages Available", this.messageQueue.length)
        this.messageQueue.forEach(q_data => {
          this.postMessageToWebview(this.activePanels[0], q_data);
        });
      // After sending all queued messages, clear the queue
      this.messageQueue = [];
      console.log("Cleared the message queue after sending queued messages.");
      }

      this.activePanels.forEach(panel => {
        try {
          // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
          panel.webview.postMessage({
            command: 'receive_chat_message',
            data: {
              response: data.response,
              unique_id: data.unique_id,
              complete: data.complete
            }
          });
        } catch (error) {
          console.log("Failed to post message to webview:", error);
          console.error("Failed to post message to webview");
        }
      });
    } else {
      // No active (visible) webviews, enqueue the message
      // console.log("No active webviews. Queuing message.");
      this.messageQueue.push(data);
      // console.log(`Message queued. Queue length: ${this.messageQueue.length}`);
    }
  }

  /**
   * Helper method to post a message to a specific webview.
   * @param webviewView - The webview to post the message to.
   * @param data - The message data to send.
   */
  private postMessageToWebview(webviewView: vscode.WebviewView, data: MessageResponse): void {
    try {
      // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
      webviewView.webview.postMessage({
        command: 'receive_chat_message',
        data: {
          response: data.response,
          unique_id: data.unique_id,
          complete: data.complete
        }
      });
    } catch (error) {
      console.log("Failed to post queued message to webview:", error);
      console.error("Failed to post queued message to webview");
    }
  }

  /**
   * Generates the HTML content for the webview.
   * @param webview - The webview instance.
   * @returns The HTML string.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'out',
        'webview-ui',
        'assets',
        'index.js'
      )
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'out',
        'webview-ui',
        'assets',
        'index.css'
      )
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; 
         img-src ${webview.cspSource} https: data:; 
         font-src  ${webview.cspSource}; 
         style-src ${webview.cspSource} 'unsafe-inline' https://*.vscode-cdn.net; 
         script-src 'nonce-${nonce}' 'strict-dynamic';"
  />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" type="text/css" href="${styleUri}">
  <title>AI Chat Panel</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}