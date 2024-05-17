import { io, Socket } from 'socket.io-client';
import * as vscode from 'vscode';
import { CompletionProviderModule } from './completionProviderModule';

export class SocketModule {
  private socket: Socket;
  public socketMainSuggestion: string | undefined;
  public suggestion: string;
  public completionProvider: CompletionProviderModule;
  public systemChangeInProgress = false; // Add this line to declare the flag
  private tempUniqueIdentifier: string;

  constructor(completionProvider: CompletionProviderModule) {
    this.completionProvider = completionProvider;
    this.socket = io('ws://localhost:5000'); // replace with the address of your Flask-SocketIO server
    this.suggestion = "";
    this.socket.on('connect', () => {
      console.log('Connected to Flask-SocketIO server');
    });
    this.tempUniqueIdentifier = "NA";

    this.socket.on('receive_message', (data: any) => {
      console.log(`*************************************************************************************`);
      // console.log(`${data.message}`);
      console.log('Input Recived');
      console.log('data.unique_Id', data.unique_Id);
      console.log('data.unique_Id', this.tempUniqueIdentifier);

      if(data.message && this.tempUniqueIdentifier === data.unique_Id){
        // console.log(`Processing suggestion: ${data.message}`);
        // data.message = data.message.replace(/\n/g, ""); // Note: Remember to remove extra line characters.
        console.log(JSON.stringify(data.message));
        this.suggestion = data.message;
        this.socketMainSuggestion = data.message;
        this.completionProvider.updateSuggestion(data.message);
        this.typeAndDelete(data.message[0]);
      } else {
        // console.log("No suggestion required");
      }
    });
  }

  public emitMessage(uuid: string, prefix: string, suffix: string, inputType: string) {
    // console.log(`========================== Getting New Suggestions ===================================`);
    // console.log(`Uuid: ${uuid}`);
    // console.log(`Prefix: ${prefix}`);
    // console.log(`Suffix: ${suffix}`);
    this.tempUniqueIdentifier = uuid
    // console.log(`tempUniqueIdentifier: ${this.tempUniqueIdentifier}`);
    this.socket.emit('send_message', { prefix, suffix, inputType, uuid });
  }

  private async typeAndDelete(letter: string) {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        const position = editor.selection.active;
        // console.log(`Current Position of Cursor: ${position}`);
        // console.log(`Provided Letter: ${letter.length}`);

        this.systemChangeInProgress = true; // Set the flag to true before making the change

        await editor.edit(editBuilder => {
            editBuilder.insert(position, ' ');
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
