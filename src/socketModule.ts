import * as vscode from 'vscode';
import { io, Socket } from 'socket.io-client';
import { CompletionProviderModule } from './completionProviderModule';
import { SOCKET_API_BASE_URL, APP_VERSION } from './config';
import { StatusBarManager } from './StatusBarManager';

export class SocketModule {
  public socket: Socket | null = null;
  public socketMainSuggestion: string | undefined;
  public suggestion: string;
  public completionProvider: CompletionProviderModule;
  public systemChangeInProgress = false;
  private tempUniqueIdentifier: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  // private statusBarManager = StatusBarManager.getInstance();

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.suggestion = "";
    this.tempUniqueIdentifier = "NA";
  }

  public connect(): Socket {
    if (this.socket) {
      // // console.log('WebSocket already connected');
      return this.socket;
    }
    this.socket = io(SOCKET_API_BASE_URL);
    // // console.log('WebSocket connected');

    this.socket.on('receive_message', (data: any) => {
      StatusBarManager.updateMessage(`Neo`);

      // // console.log("================ Recived a Response from Backend ===============")
      // // console.log("UUID sent - " , this.tempUniqueIdentifier)
      // // console.log("UUID received - " , data.unique_Id)
      console.log(JSON.stringify(data.message));
      if (data.message && this.tempUniqueIdentifier === data.unique_Id) {
        this.suggestion = data.message;
        this.socketMainSuggestion = data.message;
        // this.completionProvider.updateSuggestion("");
        this.completionProvider.updateSuggestion(data.message);
        this.triggerInlineSuggestion();
      } else {
        // // console.log("No suggestion required");
      }
    });
    return this.socket;
  }

  public emitMessage(uuid: string, prefix: string, suffix: string, inputType: string, language: string ) {
    StatusBarManager.updateMessage(`$(loading~spin)`);
    this.tempUniqueIdentifier = uuid;
    if (this.socket) {
      this.socket.emit('send_message', { prefix, suffix, inputType, uuid, APP_VERSION, language});
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
}
