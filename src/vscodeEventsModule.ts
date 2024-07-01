// src/vscodeEventsModule.ts
import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { handleActiveEditor, handleAllOpenEditors, handleAllOpenFiles } from "./components/editorUtils";
import { getTextAfterCursor, getTextBeforeCursor } from "./components/editorCodeUtils";
import { isNullOrEmptyOrWhitespace } from "./components/editorCodeUtils";
import { notSupportedFiles } from "./components/editorCodeUtils";
import { modifySuggestion } from "./components/editorCodeUtils";
import { v4 as uuidv4 } from 'uuid';
import { StatusBarManager } from './StatusBarManager';
import * as path from 'path';

export class VscodeEventsModule {
  private socketModule: SocketModule;
  private timeout: NodeJS.Timeout | undefined;
  private textAfterCursor: string | null; // Text after cursor sent to Backend
  private textBeforeCursor: string | null; // Text before cursor sent to Frontend
  private currentSelectedFileName: string | null;
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileNotSupported: boolean;
  private currentLanguage: string;
  private currentStartLineNumber: number;
  private currentStartCharacterPosition: number;
  private updatedText: string | null;
  private mainSuggestion: string;
  private tempSuggestion: string;
  public uniqueIdentifier: string = "";

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.textAfterCursor = null;
    this.textBeforeCursor = null;
    this.currentSelectedFileName = "";
    this.isFileNotSupported = false;
    this.currentLanguage = "";
    this.currentStartLineNumber = -1;
    this.currentStartCharacterPosition = -1;
    this.updatedText = "";
    this.mainSuggestion = "";
    this.tempSuggestion = "";
    this.uniqueIdentifier = uuidv4();
  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    if (this.socketModule.socket){
      // To handle when the user changes the text in the active text editor
      this.mainSuggestion = this.socketModule.suggestion;
      this.tempSuggestion = this.socketModule.completionProvider.suggestion;
      if(!this.socketModule.systemChangeInProgress){
        this.textPredictionHandeling(vscode.window.activeTextEditor, event);
      }
    }else{
      // // console.log("Web Socket Not Connected VS Module")
    }
  }

  private textPredictionHandeling(editor: vscode.TextEditor | undefined, event: vscode.TextDocumentChangeEvent): string | null {
    
    try {
          if (this.isFileNotSupported){
            return null;
          }

          const range = event.contentChanges[0].range;
          this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor);
          if (isNullOrEmptyOrWhitespace(this.textBeforeCursor)){
            this.socketModule.completionProvider.updateSuggestion("");
            return null;
          }
      
          this.currentLanguage = event.document.languageId;
          this.currentStartLineNumber = range.start.line;
          this.currentStartCharacterPosition = range.start.character;
          this.updatedText = event.contentChanges[0].text;
          let currentEndtLineNumber = range.end.line;
          let currentEndCharacterPosition = range.end.character;
          if (!this.currentLanguage){
            this.currentLanguage = ''
          }
          // Check if Text Deleted or Updated
          if (this.mainSuggestion && this.tempSuggestion){

            if (!this.updatedText || this.currentStartLineNumber !== currentEndtLineNumber || this.currentStartCharacterPosition !== currentEndCharacterPosition){
              if (this.currentStartLineNumber === currentEndtLineNumber){
                if (this.currentStartCharacterPosition < currentEndCharacterPosition){
                  let positionChange = currentEndCharacterPosition - this.currentStartCharacterPosition;
                  this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                }
              }
              if (this.currentStartLineNumber !== currentEndtLineNumber){
                if (this.tempSuggestion===this.mainSuggestion){
                  this.tempSuggestion = "";
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                }
                if (this.tempSuggestion===this.mainSuggestion){
                  this.tempSuggestion = "";
                }
              }
            }
          }

          if (!this.tempSuggestion){
            if (this.debounceTimeout) {
              clearTimeout(this.debounceTimeout);
            }
            if (editor && event.document === editor.document) {
              this.debounceTimeout = setTimeout(() => {
                if (vscode.window.activeTextEditor) {
                    this.uniqueIdentifier = uuidv4();
                    this.socketModule.completionProvider.updateSuggestion("");
                    this.socketModule.emitMessage(this.uniqueIdentifier, 
                      getTextBeforeCursor(vscode.window.activeTextEditor), 
                      getTextAfterCursor(vscode.window.activeTextEditor) , 
                      "emit-request",
                      this.currentLanguage
                    );
                }
              }, 500);
            }
          }else{
            const change = event.contentChanges[0];
            if (change.text === '\r\n') {
              // // console.log('Enter is pressed')
            }
            if (this.tempSuggestion.startsWith(change.text) && change.text.length < this.tempSuggestion.length){
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(change.text.length));
            }else{
              this.socketModule.completionProvider.updateSuggestion("");
              if (vscode.window.activeTextEditor) {
                setTimeout(() => {
                  this.uniqueIdentifier = uuidv4();
                  this.socketModule.emitMessage(this.uniqueIdentifier, 
                    getTextBeforeCursor(vscode.window.activeTextEditor), 
                    getTextAfterCursor(vscode.window.activeTextEditor) , 
                    "emit-request",
                    this.currentLanguage
                  );
                }, 500);
              }
            }
          }
        return null;
    } catch (error) {
        // console.error('An error occurred:', error);
        return null;  
    } 
  };

  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
    try {
        if (this.debounceTimeout) {
          clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = setTimeout(() => {
          this.currentSelectedFileName =  path.basename(handleActiveEditor(editor, context));
          // console.log("Cheking File Names");
          // console.log(notSupportedFiles(this.currentSelectedFileName));
          if (notSupportedFiles(this.currentSelectedFileName)) {
            // console.log("Large non code file detected");
            StatusBarManager.updateMessage(`$(error) Neo`);
            this.isFileNotSupported = true;
          }else{
            StatusBarManager.updateMessage(`Neo`);
            this.isFileNotSupported = false;
          }
          // console.log(`File Not Supported: ${this.isFileNotSupported}`);
          this.socketModule.completionProvider.updateSuggestion("");
        }, 100);
      } catch (error) {
    } 
  }
}