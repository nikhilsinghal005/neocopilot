import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { handleActiveEditor, handleAllOpenEditors, handleAllOpenFiles } from "./components/editorUtils";
import { getTextAfterCursor, getTextBeforeCursor } from "./components/editorCodeUtils";
import { isNullOrEmptyOrWhitespace } from "./components/editorCodeUtils";
import { checkFileNameForCodeCompletion } from "./components/editorCodeUtils";
import { modifySuggestion } from "./components/editorCodeUtils";

export class VscodeEventsModule {
  private socketModule: SocketModule;
  private timeout: NodeJS.Timeout | undefined;
  private textAfterCursor: string | null; // Text after cursor sent to Backend
  private textBeforeCursor: string | null; // Text before cursor sent to Frontend
  private currentSelectedFileName: string | null;
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileSupported: boolean;
  private currentLanguage: string;
  private currentStartLineNumber: number;
  private currentStartCharacterPosition: number;
  private updatedText: string | null;
  private mainSuggestion: string;
  private tempSuggestion: string;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.textAfterCursor = null;
    this.textBeforeCursor = null;
    this.currentSelectedFileName = "";
    this.isFileSupported = true;
    this.currentLanguage = "";
    this.currentStartLineNumber = -1;
    this.currentStartCharacterPosition = -1;
    this.updatedText = "";
    this.mainSuggestion = "";
    this.tempSuggestion = "";

  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    // To handle when the user changes the text in the active text editor
    this.mainSuggestion = this.socketModule.suggestion;
    this.tempSuggestion = this.socketModule.completionProvider.suggestion;
    if(!this.socketModule.systemChangeInProgress){
      this.textPredictionHandeling(vscode.window.activeTextEditor, event);
    }
  }
  
  private textPredictionHandeling(editor: vscode.TextEditor | undefined, event: vscode.TextDocumentChangeEvent): string | null {

    // if (!this.isFileSupported){
    //   // Cheking if File Format is Supported
    //   this.socketModule.completionProvider.updateSuggestion("");
    //   console.log(`File is not supported - No Action Required`);
    //   return null;
    // }

    if (vscode.window.activeTextEditor?.document.lineCount === 1){
      // As it is hard to understand 
      this.socketModule.completionProvider.updateSuggestion("");
      console.log(`Complete Document is of only one line - No Action Required`);
      return null;
    }
  
    this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor);
    if (isNullOrEmptyOrWhitespace(this.textBeforeCursor)){
      this.socketModule.completionProvider.updateSuggestion("");
      console.log(`Text after cursor is empty - No Action Required`);
      return null;
    }

    this.textAfterCursor = getTextAfterCursor(vscode.window.activeTextEditor);
    const range = event.contentChanges[0].range;
    this.currentLanguage = event.document.languageId;
    this.currentStartLineNumber = range.start.line;
    this.currentStartCharacterPosition = range.start.character;
    this.updatedText = event.contentChanges[0].text;
    let currentEndtLineNumber = range.end.line;
    let currentEndCharacterPosition = range.end.character;

    // Check if Text Deleted or Updated
    if (this.mainSuggestion !== "" && this.tempSuggestion !== ""){
      if (this.updatedText.length === 0 || this.currentStartLineNumber !== currentEndtLineNumber || this.currentStartCharacterPosition !== currentEndCharacterPosition){
        if (this.currentStartLineNumber === currentEndtLineNumber){
          console.log(`Text Deleted or Updated in the same line`);
          if (this.currentStartCharacterPosition < currentEndCharacterPosition){
            let positionChange = currentEndCharacterPosition - this.currentStartCharacterPosition;
            console.log(`Text Deleted or Updated in the same line - Position Change: ${positionChange}`);
            this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
            this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
          }
        }
        if (this.currentStartLineNumber !== currentEndtLineNumber){
          if (this.tempSuggestion!==this.mainSuggestion){
            console.log(`Text Deleted or Updated in the same line`);
            this.tempSuggestion = "";
            this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
          }
        }
      }
    }

    if (this.tempSuggestion === undefined || this.tempSuggestion ==="" ){
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      if (editor && event.document === editor.document) {
        this.debounceTimeout = setTimeout(() => {
          if (vscode.window.activeTextEditor) {
              this.textAfterCursor = getTextAfterCursor(vscode.window.activeTextEditor);
              this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor);
              this.socketModule.emitMessage(this.textBeforeCursor, this.textAfterCursor , "emit-request");
              // vscode.window.showInformationMessage('Predicting'); // Display a message to the user
          }
        }, 500);
      }
    }else{
      const change = event.contentChanges[0];
      if (this.tempSuggestion?.startsWith(change.text)){
          this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(change.text.length));
      }else{
          this.socketModule.completionProvider.updateSuggestion("");
      }       
    }
  return null;
  };

  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.currentSelectedFileName = handleActiveEditor(editor, context);
      console.log(`Current file name selected: ${this.currentSelectedFileName}`);
      // console.log(`Current file name: ${checkFileNameForCodeCompletion(this.currentSelectedFileName)}`);
      if (!checkFileNameForCodeCompletion(this.currentSelectedFileName)){
        this.isFileSupported = false;
      }else{
        this.isFileSupported = true;
      }
      this.socketModule.completionProvider.updateSuggestion("");
      console.log(`Suggestion nullified because file name is changed`);
    }, 100);
  }
}