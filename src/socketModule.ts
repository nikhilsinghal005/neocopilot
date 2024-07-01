import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { CompletionProviderModule } from './completionProviderModule';
import { SOCKET_API_BASE_URL } from './config';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';

export class SocketModule {
  public socket: Socket | null = null;
  public socketMainSuggestion: string | undefined;
  public suggestion: string;
  public completionProvider: CompletionProviderModule;
  public systemChangeInProgress = false;
  private tempUniqueIdentifier: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentVersion = versionConfig.getCurrentVersion();
  // private statusBarManager = StatusBarManager.getInstance();

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.suggestion = "";
    this.tempUniqueIdentifier = "NA";
  }

  public connect(appVersion: string): Socket {
    if (this.socket) {
      return this.socket;
    }
    this.socket = io(SOCKET_API_BASE_URL, {
      query: { appVersion }
    });

    this.socket.on('receive_message', (data: any) => {
      StatusBarManager.updateMessage(`Neo`);

      console.log(JSON.stringify(data.message));
      if (data.message && this.tempUniqueIdentifier === data.unique_Id) {
        this.suggestion = data.message;
        this.socketMainSuggestion = data.message;
        // this.completionProvider.updateSuggestion("");
        this.completionProvider.updateSuggestion(data.message);
        this.triggerInlineSuggestion();
      } else {
      }
    });

    this.socket.on('rate_limit_exceeded', (data: any) => {
      StatusBarManager.updateMessage(`Neo`);
      // vscode.window.showInformationMessage(data.error);
    });

    this.socket.on('update_app_version', (data: any) => {
      const extensionId = data.extension_id;
      this.promptUpdate(extensionId, this.currentVersion);

      // vscode.window.showInformationMessage(data.error);
    });
  
    return this.socket;
  }

  public emitMessage(uuid: string, prefix: string, suffix: string, inputType: string, language: string ) {
    StatusBarManager.updateMessage(`$(loading~spin)`);
    this.tempUniqueIdentifier = uuid;
    if (this.socket) {
      this.socket.emit('send_message', { prefix, suffix, inputType, uuid, appVersion: this.currentVersion, language});
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      // // console.log('WebSocket connection closed');
    }
  }

  private triggerInlineSuggestion() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
        vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
        // // console.log("Suggestion Triggered")
      } else {
        // // console.log('No active editor!');
      }
    }, 10); // Adjust the debounce delay as needed
  }

  private promptUpdate(extensionId: string, currentVersion: string) {
    vscode.window.showWarningMessage(
      `You are using an outdated version of this extension. Please update to the latest version (${currentVersion}).`,
      'Update Now'
    ).then(selection => {
      if (selection === 'Update Now') {
        this.openExtensionInMarketplace(extensionId);
      }
    });
  }

  private openExtensionInMarketplace(extensionId: string) {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`vscode:extension/${extensionId}`));
  }
}
