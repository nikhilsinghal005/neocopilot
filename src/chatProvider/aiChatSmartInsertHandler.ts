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

export class AiChatSmartInsertHandler {
  private socketModule: SocketModule;
  private smartInsertionManager: SmartInsertionManager = new SmartInsertionManager();;
  private updatedtext: string = "";
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
    
    // Making sure the socket is connected everytime socket connects.
    this.socketModule.socket?.on('connect', () => {
      this.attachSocketListeners();
    });
  }

  /**
   * Attach necessary socket listeners.
   */
  private attachSocketListeners(): void {
    if (!this.socketModule.socket?.listeners('recieve_editor_smart_insert').length) {
        this.socketModule.socket?.on('recieve_editor_smart_insert', (data: any) => {
          this.applySmartInsertCode(data);
        });
    }
  }

  // Add this function inside your class
  public initializeWebviewListener(webviewView: vscode.WebviewView) {
    // Check if this is the first time adding the listener for the current active panel
    if (!this.webviewListeners.has(this.aiChatPanel.activePanels[0])) {
      this.webviewListeners.add(webviewView);

      // Handle messages received from the webview
      webviewView.webview.onDidReceiveMessage(async (message: any) => {
        switch (message.command) {
          // Handles smart code insertion requests
          case 'smartCodeInsert':
            this.processSmartInsert(message);
            break;

          // Handles user actions in smart code insertion
          case 'smartCodeInsertUserAction':
            this.handleUserAction(message);
            break;
        }
      });
    }
  }


  public async processSmartInsert(message: any) {
    const editor = vscode.window.activeTextEditor;

    if (this.smartInsertionManager.currentEditor) {
      showErrorNotification('Please Complete the previous code insertion.', 0.7);
      if (this.aiChatPanel.activePanels.length > 0) {
        this.aiChatPanel.activePanels[0].webview.postMessage({
          command: 'smart_insert_to_editor_update',
          isComplete: false,
          uniqueId: uuidv4(),
          codeId: message.data.codeId,
          status: "completed_successfully"
        });
      }
      return;
    }

    this.smartInsertionManager.reinitialize();
    this.smartInsertionManager.currentEditor = editor;

    if (!editor) {
      showErrorNotification('No active editor found.', 0.7);
      if (this.aiChatPanel.activePanels.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.aiChatPanel.activePanels[0].webview.postMessage({
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

    if (editorCode.length === 0) {
      this.smartInsertionManager.oldLinesList = [];
      this.applyDirectSmartInsertCode(output);
    } else {
      this.sendSmartinsertCode(output);
    }
  }

  public async applyDirectSmartInsertCode(data: any): Promise<void> {
    console.log("Applying direct smart insert code")
    const updated_code = data.updatedCode.replace(/\r\n|\r/g, '\n').replace(/\n/g, GetLineSeparator());
    const updated_code_split = updated_code.split(GetLineSeparator());

    for (let i = 0; i < updated_code_split.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      const line = updated_code_split[i];
      this.smartInsertionManager.enqueueSnippetLineByLine(
        line,
        data.uniqueId,
        GetLineSeparator(),
        false
      );
    }

    // add a sleep time
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.smartInsertionManager.enqueueSnippetLineByLine(
      "",
      data.uniqueId,
      GetLineSeparator(),
      true
    );

    if (this.aiChatPanel.activePanels.length > 0){
      this.aiChatPanel.activePanels[0].webview.postMessage(
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


  public async applySmartInsertCode(data: any): Promise<void> {
    this.updatedtext = this.updatedtext + data.response;

    if (data.isLineComplete && !data.isError && !data.isRateLimit) {
      this.smartInsertionManager.enqueueSnippetLineByLine(
        this.updatedtext.replace(/\r\n|\r/g, '\n').replace(/\n/g, GetLineSeparator()),
        data.id,
        GetLineSeparator(),
        false
      );
      this.updatedtext = "";
    }

    if (data.isComplete) {
      if (data.isError) {
        this.aiChatPanel.activePanels[0]?.webview.postMessage({
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
        this.aiChatPanel.activePanels[0]?.webview.postMessage({
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
          GetLineSeparator(),
          true
        );

        this.updatedtext = "";
        this.aiChatPanel.activePanels[0]?.webview.postMessage({
          command: 'smart_insert_to_editor_update', 
          isComplete:  true,
          uniqueId: data.id,
          codeId: this.smartInsertionManager.currentCodeBlockId,
          status: "completed_successfully" 
        });
      }
    }
  }

  public async handleUserAction(message: any) {
    if (message.data.action == "accepted") {
        this.smartInsertionManager.acceptInsertion();
    } else if (message.data.action == "rejected") {
        this.smartInsertionManager.rejectInsertion();
    }
  }

}
