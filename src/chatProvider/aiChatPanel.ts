// webview-chat/src/aiChatPanel.ts
import * as vscode from 'vscode';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { v4 as uuidv4 } from 'uuid';
import { getNonce } from '../utilities/chatUtilities';
import { PanelManager } from './panelManager';
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';
import { getExactNewlineCharacter } from '../utilities/basicUtilities';
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';
import { AiChatMessageHandler } from './aiChatMessageHandler';
import { AiChatSmartInsertHandler } from './aiChatSmartInsertHandler';
import { AiChatContextHandler } from './aiChatContextHandler';
import { AiChatModelDetails } from './aiChatModelDetails';
import * as path from 'path';

export class AiChatPanel implements vscode.WebviewViewProvider {

  public static readonly primaryViewType = 'aiChatPanelPrimary';
  private static primaryInstance: AiChatPanel;
  public activePanels: vscode.WebviewView[] = [];
  private socketModule: SocketModule;
  private panelManager: PanelManager;
  public codeInsertionManager: CodeInsertionManager;
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();
  private aiChatMessageHandler: AiChatMessageHandler;
  private aiChatSmartInsertHandler: AiChatSmartInsertHandler;
  public aiChatContextHandler: AiChatContextHandler;
  private aiChatModelDetails: AiChatModelDetails;

  // Constructor to initialize all the required instances
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _authManager: AuthManager,
    private readonly viewType: string
  ) {
    this.socketModule = SocketModule.getInstance();
    this.panelManager = new PanelManager(this._context);
    this.codeInsertionManager = CodeInsertionManager.getInstance(this._context);
    this.aiChatMessageHandler = new AiChatMessageHandler(this, this._authManager, this._context);
    this.aiChatSmartInsertHandler = new AiChatSmartInsertHandler(this, this._authManager, this._context);
    this.aiChatContextHandler = new AiChatContextHandler(this, this._authManager, this._context); 
    this.aiChatModelDetails = new AiChatModelDetails(this, this._authManager, this._context);
  }

  // Singleton instance to ensure only one AiChatPanel instance exists
  public static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    authManager: AuthManager,
    viewType: string
  ): AiChatPanel {
    if (!AiChatPanel.primaryInstance) {
      console.log('Creating new AiChatPanel instance');
      AiChatPanel.primaryInstance = new AiChatPanel(extensionUri, context, authManager, viewType);
    }else{
      console.log('Reusing existing AiChatPanel instance');
    }
    return AiChatPanel.primaryInstance;
  }

  // Resolves the webview (UI) for this panel
  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    // Manage visibility and active panels list based on webview's visibility
    if (webviewView.visible) {
      this.activePanels.push(webviewView);
    }

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        if (!this.activePanels.includes(webviewView)) {
          this.activePanels.push(webviewView);
        }
      } else {
        this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
      }
    // Save visibility state
    this._context.workspaceState.update('webviewPanelState', {
      isVisible: webviewView.visible,
      viewType: this.viewType,
    });
    });

    webviewView.onDidDispose(() => {
      this.activePanels = this.activePanels.filter(panel => panel !== webviewView);

    // Save state on disposal
    this._context.workspaceState.update('webviewPanelState', {
      isVisible: false,
      viewType: this.viewType,
    });
    });

    // Set options for the webview (enabling scripts and setting local resource roots)
    webviewView.webview.options = {
      enableScripts: true,
      enableForms: false,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui')],
    };

    // Set the HTML content for the webview
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Add a listener for messages from the webview (e.g., user actions like sending messages)
    if (!this.webviewListeners.has(webviewView)) {
      console.log('Adding webview listener');
      this.webviewListeners.add(webviewView);
      this.aiChatMessageHandler.initializeWebviewListener(webviewView)
      this.aiChatSmartInsertHandler.initializeWebviewListener(webviewView)

      webviewView.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.command) {

          // Handles login action (opens external URL)
          case 'login':
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            this.aiChatContextHandler.getCurrentFileName(
              vscode.window.activeTextEditor,
              this._context
            );
            break;

          // Handles "Contact Us" action (opens email client)
          case 'contact_us':
            vscode.commands.executeCommand(
              'vscode.open',
              vscode.Uri.parse('mailto:support@neocopilot.com')
            );
            break;

          // Toggles sidebar visibility or location
          case 'toggleSidebar':
            await this.panelManager.togglePanelLocationChange();
            console.log("Toggled sidebar");
            break;

          // Handles code snippet insertion into terminal or editor
          case 'insertCodeSnippet':
            const nextLineCharacter = getExactNewlineCharacter();
            if (message.data.location === 'terminal') {
              this.codeInsertionManager.insertTextIntoTerminal(message.data.code);
            } else if (message.data.location === 'editor') {
              this.codeInsertionManager.insertTextUsingSnippetAtCursorWithoutDecoration(
                message.data.code + (nextLineCharacter ?? ''),
                uuidv4()
              );
            }
            break;

          // Shows a simple notification message in the status bar
          case 'showInfoPopup':
            showTextNotification(message.data.message, 3);
            break;

          // Toggles webview location (e.g., panel or sidebar)
          case 'toggle_webview':
            this.panelManager.togglePanelLocationChange();
            break;

          // Checks if the user is logged in and initializes necessary services
          case 'ready':
            const isLoggedIn = await this._authManager.verifyAccessToken();
            this.sendAuthStatus(isLoggedIn);

            if (isLoggedIn) {
              console.log('Initializing sockets');
              this.socketModule = SocketModule.getInstance();
              this.aiChatMessageHandler.initializeSockets();
              this.aiChatSmartInsertHandler.initializeSockets();
              this.aiChatModelDetails.initializeSockets();
            }
            this.getModelDetails();
            break;
        }
      });
    }
  }

  public async getModelDetails() {
    if (this.socketModule.socket) {
        this.socketModule.socket.emit('get_model_details', {
            userEmail: this.socketModule.email,
        });
    }
  }
  


  // Send authentication status to the webview
  public sendAuthStatus(isLoggedIn: boolean): void {
    this._context.workspaceState.update('isLoggedIn', isLoggedIn);
    this.aiChatContextHandler.getCurrentFileName(vscode.window.activeTextEditor, this._context);

    // Notify all active panels about the auth status
    this.activePanels.forEach(panel => {
      panel.webview.postMessage({ command: 'authStatus', isLoggedIn });
    });
  }

  // Inserts messages into the chat interface (handles file paths and code formatting)
  public async insertMessagesToChat(
    inputFile: string,
    inputText: string,
    selectedText: string,
    documentLanguage: string
  ): Promise<void> {
    await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
    await new Promise(resolve => setTimeout(resolve, 100));
    const relativePath = vscode.workspace.asRelativePath(inputFile);
    inputFile = path.basename(relativePath);

    const output = {
      command: 'insert_messages',
      fileName: inputFile,
      relativePath: relativePath,
      inputText: inputText,
      completeCode: selectedText,
    };

    inputText = `\`\`\`${documentLanguage} ?file_name=${relativePath}
${inputText}
\`\`\``;

    if (this.activePanels.length > 0) {
      this.activePanels[0].webview.postMessage(output);
    } else {
      await new Promise(resolve => setTimeout(resolve, 4000));
      this.activePanels[0].webview.postMessage(output);
    }
  }

  // Returns the HTML content for the webview, including scripts and styles
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'assets', 'index.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'out', 'webview-ui', 'assets', 'index.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta
                http-equiv="Content-Security-Policy"
                content="
                  default-src 'none'; 
                  img-src ${webview.cspSource} https: data:; 
                  font-src ${webview.cspSource}; 
                  style-src ${webview.cspSource} 'unsafe-inline' https://*.vscode-cdn.net; 
                  frame-src 'none';
                  script-src 'nonce-${nonce}' 'strict-dynamic';
                "
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
