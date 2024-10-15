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

  // Store active webviews
  private activePanels: vscode.WebviewView[] = [];
  private socketModule: SocketModule;
  private isInPrimary: boolean = true;

  // Flags to prevent multiple listeners
  private socketListenerAdded: boolean = false;
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();

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

    console.log("Web View Started")
    // Add the webview to the activePanels list when it's created
    this.activePanels.push(webviewView);

    // Remove the webview from the activePanels list when it's disposed
    webviewView.onDidDispose(() => {
      this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
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
        switch (message.command) {
          case 'send_chat_message':
            // send normal chat message
            const sanitizedMessage = this.sanitizeMessage(message.data);
            if (sanitizedMessage) {
              this.socketModule.sendChatMessage(
                  uuidv4(),
                  sanitizedMessage.timestamp,
                  sanitizedMessage.messageType,
                  sanitizedMessage.text
              );
            }
            break;
          case 'login':
            // Handle the login command and open the URL
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            break;

          case 'ready':
            // Webview signals it's ready; send authentication status
            const isAlreadyLoggedIn = this._context.workspaceState.get('isLoggedIn', false);
            if (!isAlreadyLoggedIn){
              const isLoggedIn = await this._authManager.verifyAccessToken();
              this.sendAuthStatus(isLoggedIn);
  
              if (isLoggedIn) {
                this.socketModule = SocketModule.getInstance();
                if (!this.socketListenerAdded) {
                  this.socketModule.socket?.on('receive_chat_response', (data: MessageResponse) => {
                    this.forwardMessageToWebviews(data);
                  });
                  this.socketListenerAdded = true;
                }
              }
            }


            break;
          default:
            vscode.window.showInformationMessage(`Unknown command: ${message.command}`);
        }
      });
    }
  }

  /**
   * Sanitizes incoming messages to prevent security vulnerabilities.
   * @param data - The message data to sanitize.
   * @returns The sanitized message or null if invalid.
   */
  private sanitizeMessage(data: Message): Message | null {
    try {
      console.log("Data Received from Chat UI", data);
      console.info("User chat requested");
        const sanitized: Message = {
        id: data.id.trim(),
        timestamp: new Date(data.timestamp).toISOString(),
        messageType: data.messageType,
        text: data.text.trim(),
      };
  
      return sanitized;
    } catch (error) {
      console.log("Message Sanatisation Failed:", error);
      console.error("Message Sanatisation Failed");
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
   * @param data - The chat message data received from the backend.
   */
  public forwardMessageToWebviews(data: MessageResponse): void {
    this.activePanels.forEach(panel => {
      try {
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
  }

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