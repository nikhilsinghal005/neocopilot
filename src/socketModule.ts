import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { CompletionProviderModule } from './completionProviderModule';
import { SOCKET_API_BASE_URL } from './config';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';

export class SocketModule {
  public socket: Socket | null = null;
  public socketMainSuggestion: string | undefined;
  public socketListSuggestion: string[];
  public suggestion: string;
  public completionProvider: CompletionProviderModule;
  public predictionRequestInProgress = false;
  public predictionWaitText = "";
  private tempUniqueIdentifier: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentVersion = versionConfig.getCurrentVersion();
  public currentSuggestionId: string = "";

  // private statusBarManager = StatusBarManager.getInstance();

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.tempUniqueIdentifier = "NA";
    this.predictionWaitText = "";
    this.currentSuggestionId = "";
  }

  public connect(appVersion: string): Socket {
    if (this.socket) {
      return this.socket;
    }
    this.socket = io(SOCKET_API_BASE_URL, {
      query: { appVersion }
    });

    this.socket.on('receive_message', (data: any) => {
      this.predictionRequestInProgress = false;
      StatusBarManager.updateMessage(`Neo`);

      console.log(JSON.stringify(data.message));
      if (data.message && this.tempUniqueIdentifier === data.unique_Id) {
        this.currentSuggestionId = data.unique_Id;
        console.log("Suggestion ID - ", this.currentSuggestionId);

        // Update and regulate suggestions
        this.suggestion = data.message;
        this.socketMainSuggestion = data.message;

        this.socketListSuggestion = data.message_list;
        if (this.predictionWaitText !== "") {
          if (this.suggestion.startsWith(this.predictionWaitText)){
            this.completionProvider.updateSuggestion(this.suggestion.substring(this.predictionWaitText.length));
            this.chatCompletionMessage("partial_completion", 'prediction_wait_feature', this.predictionWaitText.length);
            this.predictionWaitText = "";
          }else{
            this.completionProvider.updateSuggestion(this.suggestion);
          }
        }else{
          this.completionProvider.updateSuggestion(this.suggestion);
        }
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
    console.log("Emit Message - ",uuid);
    this.predictionRequestInProgress = true;
    this.suggestion = "";
    this.completionProvider.updateSuggestion("");
    StatusBarManager.updateMessage(`$(loading~spin)`);
    console.log("prefix - ", prefix);
    console.log("suffix - ", suffix);

    this.tempUniqueIdentifier = uuid;
    if (this.socket) {
      this.socket.emit('send_message', { prefix, suffix, inputType, uuid, appVersion: this.currentVersion, language});
    }
  }

  public chatCompletionMessage(completion_type: string, completion_comment: string, completion_size: number) {
    if (this.socket) {
      this.socket.emit('completion_accepted', {
        uuid: this.currentSuggestionId,
        completion_type,
        completion_comment,
        completion_size,
      });
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
