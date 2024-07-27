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
import { CommentDetection } from './CommentDetection';

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
  private mainListSuggestion: string[];
  public uniqueIdentifier: string = "";
  private disablePrediction: boolean;
  private predictionDelay: number = 300;
  private predictionWaitText: string;
  private userTempString: string = "";


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
    this.mainListSuggestion = [];
    this.uniqueIdentifier = uuidv4();
    this.disablePrediction = false;
    this.predictionDelay = 300;
    this.predictionWaitText = "";
    this.userTempString = "";

    
  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    if (this.socketModule.socket){

      // To handle when the user adds comment in the active text editor
      const editor = vscode.window.activeTextEditor;
      if (editor && CommentDetection.isCommentAction(event, editor)) {
        this.handleCommentAction();
        return;
      }
      
      // To enable and disbale prediction in case of comment
      if (this.disablePrediction) {
        this.disablePrediction = false;
        return;
      }

      // To handle when the user changes the text in the active text editor
      this.mainSuggestion = this.socketModule.suggestion;
      this.tempSuggestion = this.socketModule.completionProvider.suggestion;
      this.mainListSuggestion = this.socketModule.socketListSuggestion;

      // Check in Case if Prediction is Already in Progress
      if(!this.socketModule.predictionRequestInProgress){
        // If Prediction is not in Progress
        this.predictionWaitText = "";
        this.socketModule.predictionWaitText = this.predictionWaitText;
        this.textPredictionHandeling(vscode.window.activeTextEditor, event);
      }else{
        // If Prediction is in Progress
        this.predictionWaitText = this.predictionWaitText + event.contentChanges[0].text;
        this.socketModule.predictionWaitText = this.predictionWaitText;
        console.log("Prediction Wait Text: ", this.predictionWaitText);
      }
    }else{
      console.log("Socket is not connected");
    }
  }

  private textPredictionHandeling(editor: vscode.TextEditor | undefined, event: vscode.TextDocumentChangeEvent): string | null {
    
    try { 
          // Cheking if File is Supported or not
          if (this.isFileNotSupported){
            return null;
          }
          
          // Getting required parameters for prediction
          const range = event.contentChanges[0].range; // Range of the text that is changed
          this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor);

          // If text before cursor is empty then return null no prediction
          if (isNullOrEmptyOrWhitespace(this.textBeforeCursor)){
            this.socketModule.completionProvider.updateSuggestion("");
            return null;
          }

          // Getting other parameters required for prediction
          this.currentLanguage = event.document.languageId; // Language of the file
          this.currentStartLineNumber = range.start.line; // Line number of the text that is changed
          this.currentStartCharacterPosition = range.start.character; // Character position of the text that is changed
          this.updatedText = event.contentChanges[0].text; // Text that is changed
          let currentEndtLineNumber = range.end.line; // Line number of the text that is changed
          let currentEndCharacterPosition = range.end.character; // Character position of the text that is changed
          if (!this.currentLanguage){
            this.currentLanguage = 'neo-defined'
          }
          // console.log("===============================================")
          // console.log("Updated Text: ", this.updatedText);
          // console.log("Current Language: ", this.currentLanguage);
          // console.log("Current Start Line Number: ", this.currentStartLineNumber);
          // console.log("Current Start Character Position: ", this.currentStartCharacterPosition);
          // console.log("Current End Line Number: ", currentEndtLineNumber);
          // console.log("Current End Character Position: ", currentEndCharacterPosition);
          
          this.predictionDelay = 300; // Reseting time to 300ms for code precompletion diction

          /* 
            1. Cheking if suggestion exists or not
            2. Updating the suggestion if the text is deleted or updated
            3. If the text is inserted then we will send the text to the backend
           */

          if (this.mainSuggestion && this.tempSuggestion){
            console.log('SUggestion Exists')
            // Cheking if text is entered in the same line  or not
            if (!this.updatedText || this.currentStartLineNumber !== currentEndtLineNumber || this.currentStartCharacterPosition !== currentEndCharacterPosition){
              console.log("Text Deleted or Updated");
              console.log(!this.updatedText , this.currentStartLineNumber !== currentEndtLineNumber , this.currentStartCharacterPosition !== currentEndCharacterPosition);
              if (this.currentStartLineNumber === currentEndtLineNumber){
                console.log("Text Deleted or Updated in the Same Line")
                if (this.currentStartCharacterPosition < currentEndCharacterPosition){
                  console.log("Text Deleted Captured");
                  console.log(this.currentStartCharacterPosition < currentEndCharacterPosition);
                  let positionChange = currentEndCharacterPosition - this.currentStartCharacterPosition;
                  this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                  this.predictionDelay = 2000;
                }
              }

              if (this.currentStartLineNumber !== currentEndtLineNumber){
                if (this.tempSuggestion===this.mainSuggestion){
                  this.tempSuggestion = "";
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                  this.predictionDelay = 4000;
                }
                if (this.tempSuggestion===this.mainSuggestion){
                  this.tempSuggestion = "";
                  this.predictionDelay = 4000;

                }
              }
            }
          }else{
            if (this.updatedText == ''){
              this.predictionDelay = 3000;
              console.log("No Suggestion Exists")
              if (this.currentStartLineNumber === currentEndtLineNumber){
                console.log("Text Deleted or Updated in the Same Line")
                if (this.currentStartCharacterPosition - currentEndCharacterPosition < -2){
                  console.log("Text Deleted Captured with more than 2 character size");
                  this.predictionDelay = 10000;
                  return null;
                }else{
                  console.log("Texe Deleted in Same Line and less than size of 2")
                }
              }else{
                console.log("Text Deleted or Updated in the Different Line")
                this.predictionDelay = 15000;
                this.userTempString = "";
                this.mainSuggestion = "";
                this.tempSuggestion = "";
                this.socketModule.completionProvider.updateSuggestion("");
                return null;
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
              }, this.predictionDelay);
            }
          }else{
            const change = event.contentChanges[0];
            // if (change.text === '\r\n') {
            //   // // console.log('Enter is pressed')
            // }
            console.log("Change Text", change.text);
            console.log("Temp Suggestion", this.tempSuggestion);
            console.log("Updated Text", this.tempSuggestion.startsWith(change.text))
            if (this.tempSuggestion.startsWith(change.text) && change.text.length < this.tempSuggestion.length){
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(change.text.length));
                // Get main suggestion minus the updated suggestion
                this.userTempString = this.removeSubstringFromEnd(this.mainSuggestion, this.tempSuggestion.slice(change.text.length))
                console.log("Left String", this.userTempString);
            }else{
              // Check in Other Messages
              console.log("unable to find match in temp suggestion")
              this.userTempString = this.userTempString + change.text;
              console.log("Left String new", this.userTempString);
              this.mainSuggestion = this.findFirstMatch(this.mainListSuggestion,this.mainSuggestion, this.userTempString)
              if (this.mainSuggestion){
                console.log("Found Match in Main Suggestion", this.mainSuggestion);
                console.log("Left String that would be removed from match", this.userTempString);
                this.tempSuggestion = this.mainSuggestion.slice(this.userTempString.length);
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
              }else{
                console.log("Mian Suggestion Empty")
                this.userTempString = "";
                this.mainSuggestion = "";
                this.tempSuggestion = "";
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
                  }, this.predictionDelay);
                }
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
          if (notSupportedFiles(this.currentSelectedFileName)) {
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

  public removeSubstringFromEnd(str: string, subStr: string): string {
    if (str.endsWith(subStr)) {
      const newLength = str.length - subStr.length;
      return str.substring(0, newLength);
    }
    return str;
  }

  public findFirstMatch(mainListSuggestion: string[], mainSuggestion:string, subStr: string): string {
    // remove main suggestion from maiSuggestionList
    console.log("================================================")
    if (mainSuggestion){
      mainListSuggestion = mainListSuggestion.filter(item => item !== mainSuggestion);
    }
    console.log("Main List Suggestion", mainListSuggestion);
    console.log("Sub String", subStr);
    for (let item of mainListSuggestion) {
      if (item.startsWith(subStr)) {
        console.log("Found Match", item);
        return item;
      }
    }
    return '';
  }
  public handleCommentAction() {
    console.log('Comment action detected. Disabling prediction.');
    this.disablePrediction = true;

    setTimeout(() => {
      console.log('Re-enabling prediction.');
      this.disablePrediction = false;
    }, 500);
  }
}