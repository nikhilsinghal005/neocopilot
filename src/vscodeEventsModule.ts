import * as vscode from 'vscode';
import { SocketModule } from './socketModule';

export class VscodeEventsModule {
  private socketModule: SocketModule;
  private timeout: NodeJS.Timeout | undefined;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    const change = event.contentChanges[0];
    // console.log(change);
    const tempSuggestion: string | undefined = this.socketModule.completionProvider.suggestion;
    
    if (tempSuggestion !== undefined && tempSuggestion !== "Mr.Complete" && tempSuggestion!==""){
        if (tempSuggestion?.startsWith(change.text)){
            this.socketModule.completionProvider.updateSuggestion(tempSuggestion.slice(change.text.length));
            console.log("Single Line removed");
        }else{
            this.socketModule.completionProvider.updateSuggestion("");
            console.log("Suggestion Not Used");
        }
    }else{
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
      
        if (editor && event.document === editor.document) {
            // Setup the new timeout
            this.timeout = setTimeout(() => {
              const completeFileText: string = editor.document.getText(); // Getting the Complete Text of the Script
              console.log(`Complete file text: ${completeFileText}`);
      
              // Sending the event to get the suggestion
              this.socketModule.emitMessage(completeFileText);
            //   vscode.commands.executeCommand('editor.action.triggerSuggest');
              // Display a message to the user
              vscode.window.showInformationMessage('You are great in the code!');
            }, 3000);
        }
    }

    // if (change && change.text === this.socketModule.completionProvider.suggestion) {
    //   // Clear the suggestion
    //   this.socketModule.completionProvider.updateSuggestion('');
    //   console.log("Remove Data");
    // }

    // Clear the previous timeout if there is one

  }

  public handleActiveEditor(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (editor) {
      const currentFileName = editor.document.fileName;
      context.workspaceState.update('currentFileName', currentFileName);
      console.log(`Current file name: ${context.workspaceState.get('currentFileName')}`);
    }
  }
}
