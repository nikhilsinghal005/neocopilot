import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';
import { CompletionProviderModule } from './completionProviderModule';

export class SocketModule {
  private socket: Socket;
  public suggestion: string | undefined;
  public completionProvider: CompletionProviderModule;
  public systemChangeInProgress = false; // Add this line to declare the flag

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.socket = io('ws://localhost:5000'); // replace with the address of your Flask-SocketIO server

    this.socket.on('connect', () => {
      console.log('Connected to Flask-SocketIO server');
    });

    this.socket.on('receive_message', (data: any) => {
      // Update the suggestion in the completion provider
      if(data.message==="Mr.Perfect"){
        console.log("Code if Fine Suggestion not Required");
      }else{
          this.suggestion = data.message;
          this.completionProvider.updateSuggestion(data.message);
          this.typeAndDelete(data.message[0]);
          console.log(`Received suggestion: ${this.suggestion}`);  // log the suggestion
          // Trigger the suggestion
          // vscode.commands.executeCommand('editor.action.inline');
      }
    });
  }

  public emitMessage(prefix: string, suffix: string, inputType: string) {
    this.socket.emit('send_message', { prefix, suffix, inputType });
  }

  private async typeAndDelete(letter: string) {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const position = editor.selection.active;

        this.systemChangeInProgress = true; // Set the flag to true before making the change

        await editor.edit(editBuilder => {
            editBuilder.insert(position, letter);
        });

        const range = new vscode.Range(position, position.translate(0, 1));
        await editor.edit(editBuilder => {
            editBuilder.delete(range);
        });

        this.systemChangeInProgress = false; // Set the flag back to false after the change
    } else {
        console.log('No active editor!');
    }
  }
}
