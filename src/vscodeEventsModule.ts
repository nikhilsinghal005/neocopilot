import * as vscode from 'vscode';
import { SocketModule } from './socketModule';

export class VscodeEventsModule {
  private socketModule: SocketModule;
  private timeout: NodeJS.Timeout | undefined;
  private textAfterCursor: string | null;
  private textBeforeCursor: string | null;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.textAfterCursor = null;
    this.textBeforeCursor = null;
  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    const editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;
    // const change = event.contentChanges[0];
    const tempSuggestion: string | undefined = this.socketModule.completionProvider.suggestion;

    if(this.socketModule.systemChangeInProgress){
        console.log("System Change in Progress No Action Required");
    }else{
        // Setting Up
        this.textPredictionHandeling(
          vscode.window.activeTextEditor, this.textAfterCursor, this.textBeforeCursor,
          tempSuggestion, event
        );
    };
  }

  public handleActiveEditor(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (editor) {
      const currentFileName = editor.document.fileName;
      context.workspaceState.update('currentFileName', currentFileName);
      console.log(`Current file name: ${context.workspaceState.get('currentFileName')}`);
    }
  }

  private getTextAfterCursor(editor: vscode.TextEditor | undefined): string {
    // Function to get text after the cursor
    if (editor) {
      const position = editor.selection.active;
      const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount, 0));
      return editor.document.getText(range);
    }
    return "";
  }

  private getTextBeforeCursor(editor: vscode.TextEditor | undefined): string {
    // Function to get text before the cursor
    if (editor) {
      const position = editor.selection.active;
      const range = new vscode.Range(new vscode.Position(0, 0), position);
      return editor.document.getText(range);
    }
    return "";
  }

  private textPredictionHandeling(editor: vscode.TextEditor | undefined, textAfterCursor: string | null,
     textBeforeCursor: string | null, tempSuggestion: string | undefined,
     event: vscode.TextDocumentChangeEvent): string | null {

    console.log(`Current Active Suggestion: ${tempSuggestion}`);
    // Cheking if Active Suggestion has a value or not
    if (tempSuggestion === undefined || tempSuggestion ===""){
      // Active Suugestion is Null. Need to get a Suggestion
      if (this.timeout){
        clearTimeout(this.timeout); // Clearing Out Time To make sure correct Time Cheking
      };
      if (editor && event.document === editor.document) {
        this.timeout = setTimeout(() => {
          if (vscode.window.activeTextEditor) {
              this.textAfterCursor = this.getTextAfterCursor(vscode.window.activeTextEditor);
              this.textBeforeCursor = this.getTextBeforeCursor(vscode.window.activeTextEditor);
              this.socketModule.emitMessage(this.textBeforeCursor, this.textAfterCursor , "emit-request");
              // vscode.window.showInformationMessage('Predicting'); // Display a message to the user
          }
        }, 1000);
      }
    }else{
      console.log(tempSuggestion);
      const change = event.contentChanges[0];
      if (tempSuggestion?.startsWith(change.text)){
          this.socketModule.completionProvider.updateSuggestion(tempSuggestion.slice(change.text.length));
          console.log("Single Line removed");
      }else{
          this.socketModule.completionProvider.updateSuggestion("");
          console.log("Suggestion Not Used");
      }       
    }
  return null;
  };
}
