import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';
import { CompletionProviderModule } from './completionProviderModule';

export class SocketModule {
  private socket: Socket;
  public suggestion: string | undefined;
  public completionProvider: CompletionProviderModule;

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.socket = io('http://localhost:5000'); // replace with the address of your Flask-SocketIO server

    this.socket.on('connect', () => {
      console.log('Connected to Flask-SocketIO server');
    });

    this.socket.on('receive_message', (data: any) => {
      // Update the suggestion in the completion provider
      this.suggestion = data.message;
      this.completionProvider.updateSuggestion(data.message);
      console.log(`Received suggestion: ${this.suggestion}`);  // log the suggestion

      // Trigger the suggestion
      // vscode.commands.executeCommand('editor.action.triggerSuggest');
    });
  }

  public emitMessage(message: string) {
    this.socket.emit('send_message', { message });
  }
}
