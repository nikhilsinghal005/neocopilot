// src/chatProvider/aiChatSmartInsertHandler.ts
import { ChatSession, MessageResponse, MessageResponseFromBackEnd, smartInsert } from './types/messageTypes';
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { v4 as uuidv4 } from 'uuid';
import { AiChatPanel } from './aiChatPanel';
import * as vscode from 'vscode';
import { SmartInsertionManager } from '../codeInsertions/smartCodeInsert';
import { showErrorNotification } from '../utilities/statusBarNotifications/showErrorNotification';
import { GetLineSeparator } from '../utilities/editorUtils/getLineSeparator';
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';
import { showCustomNotification } from '../utilities/statusBarNotifications/showCustomNotification';
import { openAndHighlightFile } from '../utilities/editorUtils/openAndHighlightFile';
import { createFile } from '../utilities/editorUtils/createFile';

export class AiChatSmartInsertHandler {
  private socketModule: SocketModule;
  private smartInsertionManager: SmartInsertionManager = new SmartInsertionManager();
  private updatedText: string = "";
  private webviewListeners: WeakSet<vscode.WebviewView> = new WeakSet();

  constructor(
    private aiChatPanel: AiChatPanel,
    private authManager: AuthManager,
    private context: vscode.ExtensionContext
  ) {
    this.socketModule = SocketModule.getInstance();
  }

  /**
   * Initialize the socket connection and attach listeners.
   */
  public initializeSockets(): void {
    this.socketModule = SocketModule.getInstance();
    this.attachSocketListeners();

    // Reattach listeners on every socket reconnection
    this.socketModule.socket?.on('connect', () => {
      this.attachSocketListeners();
    });
  }

  /**
   * Attach necessary socket listeners.
   */
  private attachSocketListeners(): void {
    const event = 'recieve_editor_smart_insert';
    if (!this.socketModule.socket?.listeners(event).length) {
      this.socketModule.socket?.on(event, (data: any) => {
        this.applySmartInsertCode(data);
      });
    }
  }

  /**
   * Initialize webview listener for a given webview view.
   * @param webviewView The webview view to initialize.
   */
  public initializeWebviewListener(webviewView: vscode.WebviewView): void {
    const activePanel = this.aiChatPanel.activePanels[0];
    if (!activePanel || this.webviewListeners.has(activePanel)) return;

    this.webviewListeners.add(webviewView);

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.command) {
        case 'smartCodeInsert':
          await this.insertProcessVerification(message);
          break;
        case 'createNewFile':
          await this.handleCreateNewFile(message);
          break;
        case 'addToFileCurrentlyOpen':
          await this.processSmartInsert(message);
          break;
        case 'smartCodeInsertUserAction':
          this.handleUserAction(message);
          break;
        default:
          console.warn(`Unhandled message command: ${message.command}`);
      }
    });
  }

  /**
   * Helper method to send messages to the active webview.
   * @param payload The message payload.
   */
  private sendMessageToWebview(payload: any): void {
    const activePanel = this.aiChatPanel.activePanels[0];
    if (activePanel) {
      activePanel.webview.postMessage(payload);
    }
  }

  /**
   * Handle the 'createNewFile' command.
   * @param message The message data.
   */
  private async handleCreateNewFile(message: any): Promise<void> {
    const { relativePath, code, codeId } = message.data;
    try {
      const isFileCreated = await createFile(relativePath);
      if (isFileCreated) {
        const isOpenFile = await openAndHighlightFile(relativePath);
        if (isOpenFile) {
          this.aiChatPanel.codeInsertionManager.insertTextUsingSnippetAtCursorWithoutDecoration(
            `${code}${GetLineSeparator() || ''}`,
            uuidv4()
          );
        }
      }
    } catch (error) {
      console.error("Error in handleCreateNewFile:", error);
      showErrorNotification('An error occurred while creating a new file.', 0.7);
    }
  }

  /**
   * Verify and process the smart insert request.
   * @param message The message data.
   */
  public async insertProcessVerification(message: any): Promise<void> {
    try {
      if (this.smartInsertionManager.currentEditor) {
        showErrorNotification('Please complete the previous code insertion.', 0.7);
        this.sendMessageToWebview({
          command: 'smart_insert_to_editor_update',
          isComplete: false,
          uniqueId: uuidv4(),
          codeId: message.data.codeId,
          status: "completed_successfully"
        });
        return;
      }

      const editor = vscode.window.activeTextEditor;
      const currentFile = vscode.workspace.asRelativePath(editor?.document.fileName || '');
      const smartFilePath: string = message.data.relativePath;

      if (currentFile === smartFilePath) {
        this.processSmartInsert(message);
        return;
      }

      const isOpenFile = await openAndHighlightFile(smartFilePath);

      if (!isOpenFile && !vscode.window.activeTextEditor) {
        showErrorNotification('File does not exist.', 0.7);
        this.sendMessageToWebview({
          command: 'file_does_not_exist',
          isAnyFileOpen: false,
          uniqueId: uuidv4(),
          codeId: message.data.codeId,
        });
        return;
      }

      if (!isOpenFile && vscode.window.activeTextEditor) {
        showErrorNotification('File does not exist.', 0.7);
        this.sendMessageToWebview({
          command: 'file_does_not_exist',
          isAnyFileOpen: true,
          uniqueId: uuidv4(),
          codeId: message.data.codeId,
        });
        return;
      }

      this.processSmartInsert(message);
    } catch (error) {
      console.error("Error in insertProcessVerification:", error);
      this.sendMessageToWebview({
        command: 'smart_insert_to_editor_update',
        isComplete: false,
        uniqueId: uuidv4(),
        codeId: message.data.codeId,
        status: "completed_successfully"
      });
      showErrorNotification('An error occurred during code insertion.', 0.7);
    }
  }

  /**
   * Process the smart insert by sending it to the backend or applying directly.
   * @param message The message data.
   */
  public async processSmartInsert(message: any): Promise<void> {
    try {

      const editor = vscode.window.activeTextEditor;
      this.smartInsertionManager.reinitialize();
      this.smartInsertionManager.currentEditor = editor;

      if (!editor) {
        showErrorNotification('No active editor found.', 0.7);
        if (this.aiChatPanel.activePanels.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.sendMessageToWebview({
            command: 'smart_insert_to_editor_update',
            isComplete: false,
            uniqueId: uuidv4(),
            codeId: message.data.codeId,
            status: "completed_successfully"
          });
        }
        return;
      }

      const editorCode = editor.document.getText().trim();
      const updatedCode = message.data.code;

      const output: smartInsert = {
        uniqueId: uuidv4(),
        uniqueChatId: uuidv4(),
        editorCode: editorCode,
        updatedCode: updatedCode,
        actionType: "smart_update"
      };

      this.smartInsertionManager.oldLinesList = editorCode ? editorCode.split(GetLineSeparator()) : [];
      this.smartInsertionManager.currentCodeBlockId = message.data.codeId;
      this.smartInsertionManager.oldStartLine = 0;
      this.smartInsertionManager.oldEndLine = 2000;
      this.smartInsertionManager.uniqueId = output.uniqueId;

      if (editorCode.replace(/\s+/g, '').trim().length === 0 || editorCode.replace(/\s+/g, '').trim() === updatedCode.replace(/\s+/g, '').trim()) {
        this.applyDirectSmartInsertCode(output);
      } else {
        this.sendSmartInsertCode(output);
      }    
    } catch (error) {
      console.error("Error in insertProcessVerification:", error);
      this.sendMessageToWebview({
        command: 'smart_insert_to_editor_update',
        isComplete: false,
        uniqueId: uuidv4(),
        codeId: message.data.codeId,
        status: "completed_successfully"
      });
      showErrorNotification('An error occurred during code insertion.', 0.7);
    }
  }

  /**
   * Apply smart insert code directly to the editor.
   * @param data The smart insert data.
   */
  public async applyDirectSmartInsertCode(data: smartInsert): Promise<void> {
    try {
      const updatedCodeFormatted = data.updatedCode.replace(/\r\n|\r/g, '\n').replace(/\n/g, GetLineSeparator());
      const updatedCodeLines = updatedCodeFormatted.split(GetLineSeparator());

      for (const line of updatedCodeLines) {
        await new Promise(resolve => setTimeout(resolve, 10));
        this.smartInsertionManager.enqueueSnippetLineByLine(line, data.uniqueId, GetLineSeparator(), false);
      }

      // Finalize insertion
      await new Promise(resolve => setTimeout(resolve, 100));
      this.smartInsertionManager.enqueueSnippetLineByLine("", data.uniqueId, GetLineSeparator(), true);

      this.sendMessageToWebview({
        command: 'smart_insert_to_editor_update',
        isComplete: true,
        uniqueId: data.uniqueId,
        codeId: this.smartInsertionManager.currentCodeBlockId,
        status: "completed_successfully"
      });
    } catch (error) {
      console.error("Error in insertProcessVerification:", error);
      this.sendMessageToWebview({
        command: 'smart_insert_to_editor_update',
        isComplete: false,
        uniqueId: data.uniqueId,
        codeId: this.smartInsertionManager.currentCodeBlockId,
        status: "completed_successfully"
      });
      showErrorNotification('An error occurred during code insertion.', 0.7);
    }
  }

  /**
   * Send smart insert code via socket with retry logic.
   * @param inputMessages The smart insert messages.
   * @param retries Number of retry attempts.
   */
  private sendSmartInsertCode(inputMessages: smartInsert, retries = 3): void {
    if (this.socketModule.socket?.connected) {
      this.attachSocketListeners();
      this.sendEditorSmartInsert(
        inputMessages.uniqueId,
        inputMessages.uniqueChatId,
        inputMessages.editorCode,
        inputMessages.updatedCode,
        inputMessages.actionType
      );
    } else if (retries > 0) {
      setTimeout(() => {
        this.sendSmartInsertCode(inputMessages, retries - 1);
      }, 5000);
    } else {
      showTextNotification("Please check your internet connection or try again", 5);
    }
  }

  /**
   * Apply smart insert code received from the backend.
   * @param data The data from the backend.
   */
  public async applySmartInsertCode(data: any): Promise<void> {
    try {
      this.updatedText += data.response;

      if (data.isLineComplete && !data.isError && !data.isRateLimit) {
        this.smartInsertionManager.enqueueSnippetLineByLine(
          this.updatedText.replace(/\r\n|\r/g, '\n').replace(/\n/g, GetLineSeparator()),
          data.id,
          GetLineSeparator(),
          false
        );
        this.updatedText = "";
      }

      if (data.isComplete) {
        if (data.isError) {
          this.sendMessageToWebview({
            command: 'smart_insert_to_editor_update',
            isComplete: false,
            uniqueId: data.id,
            codeId: this.smartInsertionManager.currentCodeBlockId,
            status: "completed_successfully"
          });
          this.updatedText = "";
          showTextNotification(data.response, 1);
        } else if (data.isRateLimit) {
          this.sendMessageToWebview({
            command: 'smart_insert_to_editor_update',
            isComplete: false,
            uniqueId: data.id,
            codeId: this.smartInsertionManager.currentCodeBlockId,
            status: "completed_successfully"
          });
          showCustomNotification(data.response);
          this.updatedText = "";
        } else {
          // Finalize insertion
          await new Promise(resolve => setTimeout(resolve, 1000));
          this.smartInsertionManager.enqueueSnippetLineByLine("", data.id, GetLineSeparator(), true);

          this.updatedText = "";
          this.sendMessageToWebview({
            command: 'smart_insert_to_editor_update',
            isComplete: true,
            uniqueId: data.id,
            codeId: this.smartInsertionManager.currentCodeBlockId,
            status: "completed_successfully"
          });
        }
        this.socketModule.predictionRequestInProgress = false;
      }
    } catch (error) {
      console.error("Error in insertProcessVerification:", error);
      this.sendMessageToWebview({
        command: 'smart_insert_to_editor_update',
        isComplete: false,
        uniqueId: data.uniqueId,
        codeId: this.smartInsertionManager.currentCodeBlockId,
        status: "completed_successfully"
      });
      showErrorNotification('An error occurred during code insertion.', 0.7);
    }
  }

  /**
   * Handle user actions related to smart code insertion.
   * @param message The message data.
   */
  public handleUserAction(message: any): void {
    const action = message.data.action;
    if (action === "accepted") {
      this.smartInsertionManager.acceptInsertion();
    } else if (action === "rejected") {
      this.smartInsertionManager.rejectInsertion();
    } else {
      console.warn(`Unhandled user action: ${action}`);
    }
  }

  private sendEditorSmartInsert(
    uniqueId: string, 
    uniqueChatId: string, 
    editorCode: string, 
    updatedCode: string,
    actionType: string
  ) {
    console.log("Message to scoket from backend")
    this.socketModule.predictionRequestInProgress = true;
    if (this.socketModule.socket) {
      this.socketModule.socket.emit('generate_editor_smart_insert', {
        uniqueId: uniqueId,
        chatId: uniqueChatId,
        editorCode: editorCode,
        updatedCode: updatedCode,
        actionType: actionType,
        appVersion: this.socketModule.currentVersion,
        userEmail: this.socketModule.email
      });
    }
  }
}
