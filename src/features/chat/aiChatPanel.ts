// webview-chat/src/aiChatPanel.ts
import * as vscode from 'vscode';
import { AuthManager } from '../../core/auth/authManager';
import { getNonce } from '../../shared/utils/chatUtilities';
import { CodeInsertionManager } from '../inline-edit/codeInsertions/CodeInsertionManager';
import { AiChatContextHandler } from './aiChatContextHandler';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../../core/logging/Logger';

interface UploadedImage {
  fileName: string;
  filePath: string;
  fileType: string;
  fileContent: string;
  isActive: boolean;
  isManuallyAddedByUser: boolean;
}

export class AiChatPanel implements vscode.WebviewViewProvider {
  private logger = Logger.getInstance();

  public static readonly primaryViewType = 'aiChatPanelPrimary';
  private static primaryInstance: AiChatPanel;
  public activePanels: vscode.WebviewView[] = [];
  private _view: vscode.WebviewView | undefined;
  // SocketModule is removed, no socket communication in chat panel.
  public codeInsertionManager: CodeInsertionManager;
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();
  public aiChatContextHandler: AiChatContextHandler;

  // Constructor to initialize all the required instances
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
    private readonly _authManager: AuthManager,
    private readonly viewType: string
  ) {
    // SocketModule initialization removed.
    this.codeInsertionManager = CodeInsertionManager.getInstance(this._context);
    this.aiChatContextHandler = new AiChatContextHandler(this, this._authManager, this._context);
    // aiChatModelDetails removed
  }

  // Singleton instance to ensure only one AiChatPanel instance exists
  public static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    authManager: AuthManager,
    viewType: string
  ): AiChatPanel {
    if (!AiChatPanel.primaryInstance) {
      const logger = Logger.getInstance();
      logger.info('Creating new AiChatPanel instance');
      AiChatPanel.primaryInstance = new AiChatPanel(extensionUri, context, authManager, viewType);
    } else {
      const logger = Logger.getInstance();
      logger.info('Reusing existing AiChatPanel instance');
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
    this._view = webviewView;
    if (webviewView.visible) {
      this.logger.info('Webview is visible');
      this.activePanels.push(webviewView);
    }

    webviewView.onDidChangeVisibility(() => {
      this.logger.debug('Webview visibility changed');
      // Manage visibility and active panels list based on webview's visibility
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
      this._view = undefined;

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
    this.logger.info('Setting webview HTML');
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Add a listener for messages from the webview (e.g., user actions like sending messages)
    if (!this.webviewListeners.has(webviewView)) {
      this.logger.debug('Adding webview listener');
      this.webviewListeners.add(webviewView);

      webviewView.webview.onDidReceiveMessage(async (message: { command: string;[key: string]: unknown }) => {
        switch (message.command) {
          case 'upload_image': {
            const _chatId = message.chatId;
            vscode.window.showOpenDialog({
              canSelectMany: true,
              canSelectFiles: true,
              canSelectFolders: false,
              openLabel: 'Upload Image',
              filters: { images: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] },
            }).then((files) => {
              if (files && files.length > 0) {
                const uploadedImages: UploadedImage[] = [];

                files.forEach(file => {
                  try {
                    const fileName = path.basename(file.fsPath);
                    const fileType = path.extname(file.fsPath).slice(1);
                    const fileSize = fs.statSync(file.fsPath).size;

                    if (fileSize > 5000000) {
                      vscode.window.showErrorMessage(
                        `File ${fileName} is too large. Please upload a file smaller than 5MB.`
                      );
                    } else {
                      uploadedImages.push({
                        fileName: fileName,
                        filePath: file.fsPath,
                        fileType: fileType,
                        fileContent: fs.readFileSync(file.fsPath, 'base64'),
                        isActive: true,
                        isManuallyAddedByUser: true,
                      });
                    }
                  } catch (err) {
                    vscode.window.showErrorMessage(
                      `Error processing file ${file.fsPath}: ${(err as Error).message}`
                    );
                  }
                });
              }
            });
            break;
          }
          case 'copy_paste_image':
            try {
              const pastedImages = message.images;
              if (Array.isArray(pastedImages) && pastedImages.length > 0) {
                // Store images in the chat session
                const _uploadedImages = pastedImages.map((image: UploadedImage) => ({
                  ...image,
                }));
              }
            } catch (error: unknown) {
              this.logger.error('Error handling pasted image:', error);
              if (error instanceof Error) {
                vscode.window.showErrorMessage(`Error processing pasted image: ${error.message}`);
              } else {
                vscode.window.showErrorMessage('An unknown error occurred while processing a pasted image.');
              }
            }
            break;

        }
      });
    }

  }

  public sendAuthStatus(isAuthenticated: boolean) {
    this.activePanels.forEach(panel => {
      panel.webview.postMessage({
        command: 'authStatus',
        isAuthenticated: isAuthenticated,
      });
    });
  }
 
  public newChat() {
    this.activePanels.forEach(panel => {
      panel.webview.postMessage({
        command: 'newChat',
      });
    });
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
