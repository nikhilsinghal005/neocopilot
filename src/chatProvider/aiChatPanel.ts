// webview-chat/src/aiChatPanel.ts

import * as vscode from 'vscode';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { Message } from './types/messageTypes';
import { v4 as uuidv4 } from 'uuid';

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
    // Initialize the SocketModule
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
            // Validate and sanitize the incoming message
            const sanitizedMessage = this.sanitizeMessage(message.data);
            if (sanitizedMessage) {
              // Forward the message to the backend server via Socket.io
              this.socketModule.sendChatMessage(
                uuidv4(),
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
            const isLoggedIn = await this._authManager.verifyAccessToken();
            this.sendAuthStatus(isLoggedIn);

            if (isLoggedIn) {
              // Get Socket Module
              this.socketModule = SocketModule.getInstance();

              // Add socket listener only once
              if (!this.socketListenerAdded) {
                this.socketModule.socket?.on('receive_chat_response', (data: any) => {
                  this.forwardMessageToWebviews(data);
                });
                this.socketListenerAdded = true;
              }

              // // Send a test message with the correct structure
              // this.activePanels.forEach(panel => {
              //   panel.webview.postMessage({
              //     command: 'receive_chat_message',
              //     data: {
              //       response: "Welcome to the AI Chat Panel!",
              //       unique_id: uuidv4(),
              //       complete: true
              //     }
              //   });
              // });
            }
            break;
          case 'toggle_side':
            this.toggleSide();
            break;
          default:
            vscode.window.showInformationMessage(`Unknown command: ${message.command}`);
        }
      });
    }
  }

  private async toggleSide() {
    this.isInPrimary = !this.isInPrimary;
    const targetViewType = this.isInPrimary ? AiChatPanel.primaryViewType : AiChatPanel.secondaryViewType;

    // Unregister from current container
    const currentContainerId = this.isInPrimary ? 'codebuddy-secondary' : 'codebuddy';
    const targetContainerId = this.isInPrimary ? 'codebuddy' : 'codebuddy-secondary';

    // Hide current view
    vscode.commands.executeCommand('workbench.view.extension.' + currentContainerId);

    // Show target view
    vscode.commands.executeCommand('workbench.view.extension.' + targetContainerId);

    // Inform user
    vscode.window.showInformationMessage(`AI Chat Panel moved to the ${this.isInPrimary ? 'left' : 'right'} sidebar.`);
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
  public forwardMessageToWebviews(data: any): void {
    console.log("Forwarding message to webviews:", data.response);
    this.activePanels.forEach(panel => {
      panel.webview.postMessage({
        command: 'receive_chat_message',
        data: {
          response: data.response,
          unique_id: data.unique_id,
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
