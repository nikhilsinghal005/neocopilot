// webview-chat/src/aiChatPanel.ts
import * as vscode from 'vscode';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { ChatSession, MessageResponse, MessageResponseFromBackEnd } from './types/messageTypes';
import { v4 as uuidv4 } from 'uuid';
import { getNonce } from '../utilities/chatUtilities';
import { PanelManager } from './panelManager'
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';
import { getExactNewlineCharacter } from '../utilities/basicUtilities';
import { SmartInsertionManager } from '../codeInsertions/smartCodeInsert';
import { handleActiveEditor } from "../utilities/codeCompletionUtils/editorUtils";
import * as path from 'path';
import { notSupportedFiles } from "../utilities/codeCompletionUtils/completionUtils";
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';
import { showErrorNotification } from '../utilities/statusBarNotifications/showErrorNotification';
import { showCustomNotification } from '../utilities/statusBarNotifications/showCustomNotification';

interface smartInsert {
  uniqueId: string, 
  uniqueChatId: string, 
  editorCode: string, 
  updatedCode: string,
  actionType: string
}

export class AiChatPanel implements vscode.WebviewViewProvider {
  public static readonly primaryViewType = 'aiChatPanelPrimary';
  private static primaryInstance: AiChatPanel;
  private currentSelectedFileName: string = "";
  private currentSelectedFilePath: string = "";
  private activePanels: vscode.WebviewView[] = [];
  private socketModule: SocketModule;
  private panelManager: PanelManager;
  private codeInsertionManager: CodeInsertionManager;
  private smartInsertionManager: SmartInsertionManager = new SmartInsertionManager();;
  private updatedtext: string = "";
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileNotSupported: boolean = false;
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
    this.panelManager = new PanelManager(this._context);
    this.codeInsertionManager = CodeInsertionManager.getInstance(this._context);

  }

  public static getInstance(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    authManager: AuthManager,
    viewType: string
  ): AiChatPanel {
    if (!AiChatPanel.primaryInstance) {
      AiChatPanel.primaryInstance = new AiChatPanel(extensionUri, context, authManager, viewType);
    }
    return AiChatPanel.primaryInstance;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {

    if (webviewView.visible) {
      this.activePanels.push(webviewView);
    }

    // Handle visibility changes
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Add to activePanels if not already present
        if (!this.activePanels.includes(webviewView)) {
          this.activePanels.push(webviewView);
        }
      } else {
        // Remove from activePanels
        this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
      }
    });

    // Remove the webview from the activePanels list when it's disposed (if it ever gets disposed)
    webviewView.onDidDispose(() => {
      this.activePanels = this.activePanels.filter(panel => panel !== webviewView);
    });

    // Allow scripts in the webview
    webviewView.webview.options = {
      enableScripts: true,
      enableForms: false,
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

        // console.log("Received message from webview:", message);
        switch (message.command) {
          case 'send_chat_message':
            const inputChat: ChatSession = message.data
            this.attemptSocketConnection(inputChat)
            break;
          case 'login':
            // Handle the login command and open the URL
            vscode.env.openExternal(vscode.Uri.parse(message.url));
            this.getCurrentFileName(vscode.window.activeTextEditor, this._context)
            break;
          case 'contact_us':
            // Handle the contact us command and open the URL
            require('vscode').commands.executeCommand('vscode.open', vscode.Uri.parse('mailto:support@neocopilot.com'));
            break;
          case 'toggleSidebar':
              // Add the code to toggle the panel's location
              await this.togglePanelLocation();
              break;
          case 'insertCodeSnippet':
              // console.log("insertCodeSnippet")
              const nextLineCharacter: string | undefined = getExactNewlineCharacter()
              if (message.data.location === "terminal") {
                this.codeInsertionManager.insertTextIntoTerminal(
                  message.data.code
                )
              } else if (message.data.location === "editor") {
                if (nextLineCharacter){
                  this.codeInsertionManager.insertTextUsingSnippetAtCursorWithoutDecoration(
                    message.data.code + nextLineCharacter,
                    uuidv4()
                  )
                } else {
                  this.codeInsertionManager.insertTextUsingSnippetAtCursorWithoutDecoration(
                    message.data.code,
                    uuidv4()
                  )
                }
              }
              break;
          
          case 'smartCodeInsert':
              const editor = vscode.window.activeTextEditor;
              if (this.smartInsertionManager.currentEditor) {
                console.log("test----------------")
                showErrorNotification('Please Complete the previous code insertion.', 0.7);
                this.activePanels[0].webview.postMessage(
                  {
                  command: 'smart_insert_to_editor_update', 
                  isComplete:  false,
                  uniqueId: uuidv4(),
                  codeId: message.data.codeId,
                  status: "completed_successfully" 
                  }

              );
              return;
              }
              
              this.smartInsertionManager.reinitialize()
              this.smartInsertionManager.currentEditor = editor;
              if (!editor) {
                // show Information
                showErrorNotification('No active editor found.', 0.7);
                if (this.activePanels.length > 0){
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  this.activePanels[0].webview.postMessage(
                      {
                      command: 'smart_insert_to_editor_update', 
                      isComplete:  false,
                      uniqueId: uuidv4(),
                      codeId: message.data.codeId,
                      status: "completed_successfully" 
                      }
                  );
                }
                return;
              }
              // get complete text of the current doc
              const editorCode = editor.document.getText().trim();
              const updatedCode = message.data.code

              if (editorCode.length === 0) {
                this.smartInsertionManager.oldLinesList = [];
                this.smartInsertionManager.currentCodeBlockId = message.data.codeId
                // console.log("oldLinesList", this.smartInsertionManager.oldLinesList)
                this.smartInsertionManager.oldStartLine = 0;
                this.smartInsertionManager.oldEndLine = 1000;
                this.smartInsertionManager.uniqueId = uuidv4();
                const output : smartInsert = {
                  "uniqueId": this.smartInsertionManager.uniqueId,
                  "uniqueChatId": uuidv4(),
                  "editorCode": editorCode,
                  "updatedCode": updatedCode,
                  "actionType": "smart_update"
                }
                this.applyDirectSmartInsertCode(output)
              } else {
                this.smartInsertionManager.oldLinesList = editorCode.split(this.getLineSeparator());
                this.smartInsertionManager.currentCodeBlockId = message.data.codeId
                // console.log("oldLinesList", this.smartInsertionManager.oldLinesList)
                this.smartInsertionManager.oldStartLine = 0;
                this.smartInsertionManager.oldEndLine = 1000;
                this.smartInsertionManager.uniqueId = uuidv4();
                const output : smartInsert = {
                  "uniqueId": this.smartInsertionManager.uniqueId,
                  "uniqueChatId": uuidv4(),
                  "editorCode": editorCode,
                  "updatedCode": updatedCode,
                  "actionType": "smart_update"
                }
                this.sendSmartinsertCode(output)
              }
              break;
        
          case 'smartCodeInsertUserAction':
              if (message.data.action === "accepted") {
                this.smartInsertionManager.acceptInsertion()
              } else if (message.data.action === "rejected") {
                this.smartInsertionManager.rejectInsertion()
              }
              break;
          case 'showInfoPopup':
              showTextNotification(message.data.message, 1)
              // Show vscode information message popup with fixed timeout
              break;
          case 'toggle_webview':
              console.log("Received 'toggle_webview' message from webview.");
              this.panelManager.togglePanelLocationChange()

          case 'ready':
            // Webview signals it's ready; send authentication status
              const isLoggedIn = await this._authManager.verifyAccessToken();
              this.sendAuthStatus(isLoggedIn);

              if (isLoggedIn) {
                this.socketModule = SocketModule.getInstance();
              // Add the socket listener for receiving messages
              this.attachSocketListeners();

              // Re-register socket event listeners on reconnection
              this.socketModule.socket?.on('connect', () => {
                // console.log("Socket reconnected. Re-attaching listeners.");
                this.attachSocketListeners();
              });
              }

            // Send any queued messages
            if (this.messageQueue.length > 0) {
              // console.log(`Sending ${this.messageQueue.length} queued message(s) to the webview.`);
              this.messageQueue.forEach(data => {
                this.postMessageToWebview(webviewView, data);
              });
              // Clear the queue after sending
              this.messageQueue = [];
              // console.log("Message queue cleared.");
            }
            break;
          default:
            showTextNotification("Unable to perform provided action", 1);
        }
      });
    }

    // Initial sending of queued messages if the webview is visible
    if (this.messageQueue.length > 0 && webviewView.visible) {
      // console.log(`Sending ${this.messageQueue.length} queued message(s) to the webview.`);
      this.messageQueue.forEach(data => {
        this.postMessageToWebview(webviewView, data);
      });
      // Clear the queue after sending
      this.messageQueue = [];
      // console.log("Message queue cleared.");
    }
  }


  public getOpenFiles(): Array<{ 
    fileName: string;
    filePath: string; // This will now be relative
    languageId: string | null;
}> {
    const openFiles = vscode.window.tabGroups.all
        .flatMap(group => group.tabs)
        .filter(tab => tab.input && tab.input instanceof vscode.TabInputText) // Ensure it's a file tab
        .map(tab => {
            const document = (tab.input as vscode.TabInputText).uri;
            const textDocument = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === document.toString());

            return {
                fileName: path.basename(document.fsPath),
                filePath: vscode.workspace.asRelativePath(document.fsPath),
                languageId: textDocument ? textDocument.languageId : null // Retrieve languageId if available
            };
        });

    return openFiles;
  }

  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.currentSelectedFileName = path.basename(handleActiveEditor(editor, context));
      const currentSelectedFileRelativePath = vscode.workspace.asRelativePath(handleActiveEditor(editor, context));
      if (notSupportedFiles(this.currentSelectedFileName) || currentSelectedFileRelativePath==='tasks') {
        if (this.activePanels.length > 0){
          this.activePanels[0].webview.postMessage(
              {
                command: 'editor_changed_context_update_event', 
                currentSelectedFileName:  this.currentSelectedFileName,
                currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                action: "user_opened_unsupported_file_in_editor"
              }
          );
        }
      } else {

        if (this.activePanels.length > 0){
          this.activePanels[0].webview.postMessage(
              {
                command: 'editor_changed_context_update_event', 
                currentSelectedFileName:  this.currentSelectedFileName,
                currentSelectedFileRelativePath: currentSelectedFileRelativePath,
                action: "user_opened_in_editor"
              }
          );
        }
      }

      let openFiles = this.getOpenFiles();
      openFiles = openFiles.filter(file => !notSupportedFiles(file.fileName)); // remove not supported files
      openFiles = openFiles.filter(file => file.filePath !== vscode.workspace.asRelativePath(handleActiveEditor(editor, context)));       // remove current file from list
      console.log("----------------", openFiles)

      if (this.activePanels.length > 0){
        this.activePanels[0].webview.postMessage(
          {
            command: 'editor_open_files_list_update_event',
            openFiles: openFiles
          }
        );
      }
    }, 100);
  }

  private attemptSocketConnection(inputChat: ChatSession, retries = 3) {
    if (this.socketModule.socket?.connected) {
      this.attachSocketListeners();
      this.socketModule.sendChatMessage(
        inputChat
        );
    } else if (retries > 0) {
      // console.log(`Attempting to reconnect... (${4 - retries}/3)`);
      
      setTimeout(() => {
        this.attemptSocketConnection(inputChat, retries - 1);
      }, 5000);
    } else {
      // console.log("Failed to reconnect.");
      this.forwardMessageToWebviews(
        { 
          chatId: inputChat.chatId,
          id: uuidv4(),
          response: "Please check your internet connection. or try again",
          isComplete: true
        }
      )
    }
  }

  private sendSmartinsertCode(inputMessages: smartInsert, retries = 3) {
    if (this.socketModule.socket?.connected) {
      this.attachSocketListeners();
      this.socketModule.sendEditorSmartInsert(
        inputMessages.uniqueId,
        inputMessages.uniqueChatId,
        inputMessages.editorCode,
        inputMessages.updatedCode,
        inputMessages.actionType
      );
    } else if (retries > 0) {
      // console.log(`Attempting to reconnect... (${4 - retries}/3)`);
      
      setTimeout(() => {
        this.sendSmartinsertCode(inputMessages, retries - 1);
      }, 5000);
    } else {
      // console.log("Failed to reconnect.");
      showTextNotification("Please check your internet connection. or try again", 5)
    }
  }


  private attachSocketListeners(): void {
    if (this.socketModule.socket?.listeners('receive_chat_response').length === 0) {
      // console.log("Adding 'receive_chat_response' listener.");
      this.socketModule.socket?.on('receive_chat_response', (data: MessageResponseFromBackEnd) => {
        this.forwardMessageToWebviews(data);
      });
      this.socketModule.socket?.on('recieve_editor_smart_insert', (data: any) => {
        this.applySmartInsertCode(data);
      });
    } else {
      // console.log("'receive_chat_response' listener already exists.");
    }
  }
  

  private async togglePanelLocation(): Promise<void> {
    this.panelManager.togglePanelLocationChange()
  }

  /**
   * Sends the authentication status to all active aiChatPanel webviews.
   * @param isLoggedIn - Boolean indicating if the user is logged in.
   */
  public sendAuthStatus(isLoggedIn: boolean): void {
    // console.log(`Sending authStatus (${isLoggedIn}) to ${this.activePanels.length} panel(s).`);

    // Save the logged-in status in workspace state
    this._context.workspaceState.update('isLoggedIn', isLoggedIn);
    this.getCurrentFileName(vscode.window.activeTextEditor, this._context)

    this.activePanels.forEach(panel => {
      panel.webview.postMessage({ command: 'authStatus', isLoggedIn });
    });
  }
  private getLineSeparator(): string {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '\n'; // Default to LF if no editor is active
    }
    const eol = editor.document.eol;
    return eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  }
  /**
   * Forwards incoming chat messages from the backend to all active webviews.
   * If no webviews are active, the message is queued.
   * @param data - The chat message data received from the backend.
   */
  public async applySmartInsertCode(data: any): Promise<void> {
    this.updatedtext = this.updatedtext + data.response;

    if (data.isLineComplete && !data.isError && !data.isRateLimit) {
      this.smartInsertionManager.enqueueSnippetLineByLine(
        this.updatedtext.replace(/\r\n|\r/g, '\n').replace(/\n/g, this.getLineSeparator()),
        data.id,
        this.getLineSeparator(),
        false
      );
      this.updatedtext = "";
    }

    if (data.isComplete) {
      if (data.isError) {
        this.activePanels[0]?.webview.postMessage({
            command: 'smart_insert_to_editor_update', 
            isComplete:  false,
            uniqueId: data.id,
            codeId: this.smartInsertionManager.currentCodeBlockId,
            status: "completed_successfully" 
          });
          this.updatedtext = "";
          showTextNotification(data.response, 1);
        }
      else if (data.isRateLimit) {
        this.activePanels[0]?.webview.postMessage({
          command: 'smart_insert_to_editor_update', 
          isComplete:  false,
          uniqueId: data.id,
          codeId: this.smartInsertionManager.currentCodeBlockId,
          status: "completed_successfully" 
        });
        showCustomNotification(data.response)
        this.updatedtext = "";
      } else {
        // add a sleep time
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.smartInsertionManager.enqueueSnippetLineByLine(
          "",
          data.id,
          this.getLineSeparator(),
          true
        );

        this.updatedtext = "";
        this.activePanels[0]?.webview.postMessage({
          command: 'smart_insert_to_editor_update', 
          isComplete:  true,
          uniqueId: data.id,
          codeId: this.smartInsertionManager.currentCodeBlockId,
          status: "completed_successfully" 
        });
      }
    }
  }

  /**
   * Forwards incoming chat messages from the backend to all active webviews.
   * If no webviews are active, the message is queued.
   * @param data - The chat message data received from the backend.
   */
  public async applyDirectSmartInsertCode(data: any): Promise<void> {
    console.log("Applying direct smart insert code")
    const updated_code = data.updatedCode.replace(/\r\n|\r/g, '\n').replace(/\n/g, this.getLineSeparator());
    const updated_code_split = updated_code.split(this.getLineSeparator());

    for (let i = 0; i < updated_code_split.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const line = updated_code_split[i];
      this.smartInsertionManager.enqueueSnippetLineByLine(
        line,
        data.uniqueId,
        this.getLineSeparator(),
        false
      );
    }

    // add a sleep time
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.smartInsertionManager.enqueueSnippetLineByLine(
      "",
      data.uniqueId,
      this.getLineSeparator(),
      true
    );

    if (this.activePanels.length > 0){
      this.activePanels[0].webview.postMessage(
          {
          command: 'smart_insert_to_editor_update', 
          isComplete:  true,
          uniqueId: data.uniqueId,
          codeId: this.smartInsertionManager.currentCodeBlockId,
          status: "completed_successfully" 
          }
      );
    }
  }

  /**
   * Forwards incoming chat messages from the backend to all active webviews.
   * If no webviews are active, the message is queued.
   * @param data - The chat message data received from the backend.
   */
  public forwardMessageToWebviews(data: MessageResponseFromBackEnd): void {
    // // console.log(`forwardMessageToWebviews called. Active panels count: ${this.activePanels.length}`);
    
    if (this.activePanels.length > 0) {
      if (this.messageQueue.length > 0) {
        // console.log("Count of messsages Available", this.messageQueue.length)
        this.messageQueue.forEach(q_data => {
          this.postMessageToWebview(this.activePanels[0], q_data);
        });
      // After sending all queued messages, clear the queue
      this.messageQueue = [];
      // console.log("Cleared the message queue after sending queued messages.");
      }

      this.activePanels.forEach(panel => {
        try {
          // // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
          panel.webview.postMessage({
            command: 'receive_chat_message',
            data: {
              chatId: data.chatId,
              response: data.response,
              id: data.id,
              isComplete: data.isComplete
            }
          });
        } catch (error) {
          // console.log("Failed to post message to webview:", error);
          console.error("Failed to post message to webview");
        }
      });
    } else {
      // No active (visible) webviews, enqueue the message
      this.messageQueue.push(data);
      // // console.log(`Message queued. Queue length: ${this.messageQueue.length}`);
    }
  }

  public async insertMessagesToChat(inputFile: string, inputText: string, selectedText: string, documentLanguage: string): Promise<void> {

    await vscode.commands.executeCommand('aiChatPanelPrimary.focus');
    await new Promise(resolve => setTimeout(resolve, 100));
    const relativePath = vscode.workspace.asRelativePath(inputFile);
    inputFile = path.basename(relativePath);
    const output = { 
      command: 'insert_messages', 
      fileName: inputFile,
      relativePath: relativePath,
      inputText: inputText,
      completeCode: selectedText
     }

//     inputText = 
// `\`\`\`${documentLanguage} ?file_name=${relativePath}
// ${inputText}
// \`\`\``;
    if (this.activePanels.length > 0){
      this.activePanels[0].webview.postMessage(
        output
      );
    } else {
      await new Promise(resolve => setTimeout(resolve, 4000));
      this.activePanels[0].webview.postMessage(
        output
      );
    }
  }

  /**
   * Helper method to post a message to a specific webview.
   * @param webviewView - The webview to post the message to.
   * @param data - The message data to send.
   */
  private postMessageToWebview(webviewView: vscode.WebviewView, data: MessageResponse): void {
    try {
      // // console.log(`Posting message to webview: ${JSON.stringify(data)}`);
      webviewView.webview.postMessage({
        command: 'receive_chat_message',
        data: {
          chatId: data.chatId,
          response: data.response,
          unique_id: data.id,
          isComplete: data.isComplete
        }
      });
    } catch (error) {
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