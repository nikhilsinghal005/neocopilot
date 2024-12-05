// src/chatProvider/aiChatPanelSocketHandler.ts
import { AuthManager } from '../authManager/authManager';
import { SocketModule } from '../socketModule';
import { AiChatPanel } from './aiChatPanel';
import * as vscode from 'vscode';

export class AiChatModelDetails {
  private socketModule: SocketModule;

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
    if (!this.socketModule.socket?.listeners('basic_app_details').length) {
      this.socketModule.socket?.on('basic_app_details', (data: any) => {
        const chatData = data.chat_model_limits
        this.chatDetailsUpdate(chatData)
      });
    }
  }

  public chatDetailsUpdate(model_details: any) {
    this.aiChatPanel.activePanels[0]?.webview.postMessage(
        {
          command: 'update_chat_details', 
          model_details: model_details
        }
    );
  }

}
