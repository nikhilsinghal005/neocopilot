// webview-chat/src/aiChatPanel.ts

import * as vscode from 'vscode';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { Message } from './types/messageTypes';
import { v4 as uuidv4 } from 'uuid';

export class AiChatPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiChatPanel';
  private static instance: AiChatPanel;

  // Store active webviews
  private activePanels: vscode.WebviewView[] = [];
  private socketModule: SocketModule;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _authManager: AuthManager

  ) {
    // Initialize the SocketModule
    this.socketModule = SocketModule.getInstance();

    // Listen for messages from the Socket.io server
    this.socketModule.socket?.on('receive_chat_response', (data: any) => {
      console.log("====================")
      this.activePanels.forEach(panel => {
        panel.webview.postMessage({
          command: 'receive_chat_message',
          data: {
            id: "39rh3ohr9832hrofjwhdoi3u08r",
            timestamp: new Date().toISOString(),
            current: "How are You!",
            complete: true
          }
        });
      });
    });
  }

  public static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    authManager: AuthManager
  ): AiChatPanel {
    if (!AiChatPanel.instance) {
      AiChatPanel.instance = new AiChatPanel(extensionUri, context, authManager);
    }
    return AiChatPanel.instance;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
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

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      console.log('Extension received message:', message);
      switch (message.command) {
        case 'send_chat_message':
          // Validate and sanitize the incoming message
          // const sanitizedMessage = this.sanitizeMessage(message.data);
          if (message.data) {
            // Forward the message to the backend server via Socket.io
            this.socketModule.sendChatMessage(
              uuidv4(),
              message.data.text
            );
          }
          break;
        case 'login':
          // Handle the login command and open the URL
          vscode.env.openExternal(vscode.Uri.parse(message.url));
          break;
        case 'ready':
          // Webview signals it's ready; send authentication status
          const isLoggedIn = await this._authManager.verifyAccessToken();
          console.log('Sending authStatus:', isLoggedIn);
          this.sendAuthStatus(isLoggedIn);
          this.activePanels.forEach(panel => {
            panel.webview.postMessage({
              command: 'receive_chat_message',
              data: {
                id: "39rh3ohr9832hrofjwhdoi3u08r",
                timestamp: new Date().toISOString(),
                current: "How are You!",
                complete: true
              }
            });
          });
          break;
        default:
          vscode.window.showInformationMessage(`Unknown command: ${message.command}`);
      }
    });
  }

  /**
   * Sanitizes incoming messages to prevent security vulnerabilities.
   * @param data - The message data to sanitize.
   * @returns The sanitized message or null if invalid.
   */
  private sanitizeMessage(data: any): Message | null {
    if (
      !data ||
      typeof data.id !== 'string' ||
      typeof data.timestamp !== 'string' ||
      (data.messageType !== 'user' && data.messageType !== 'system') ||
      typeof data.text !== 'string'
    ) {
      console.warn('Invalid message format:', data);
      return null;
    }

    // Additional sanitization can be performed here if necessary
    const sanitized: Message = {
      id: data.id.trim(),
      timestamp: new Date(data.timestamp).toISOString(),
      messageType: data.messageType,
      text: data.text.trim(),
    };

    return sanitized;
  }

  /**
   * Sends the authentication status to all active aiChatPanel webviews.
   * @param isLoggedIn - Boolean indicating if the user is logged in.
   */
  public sendAuthStatus(isLoggedIn: boolean): void {
    console.log(`Sending authStatus (${isLoggedIn}) to ${this.activePanels.length} panel(s).`);

    this.activePanels.forEach(panel => {
      panel.webview.postMessage({ command: 'authStatus', isLoggedIn });
    });
  }

  /**
   * Forwards incoming chat messages from the backend to all active webviews.
   * @param data - The chat message data received from the backend.
   */
  private forwardMessageToWebviews(data: any): void {
    console.log("Forwarding message to webviews:", data);  
    console.log('Webview is ready, sending message:', data);
  
    this.activePanels.forEach(panel => {
      panel.webview.postMessage({
        command: 'receive_chat_message',
        data: {
          response: data.text,
          unique_id: data.id,
          complete: data.complete
        }
      });
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
    content="default-src 'none'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval';"
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

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
