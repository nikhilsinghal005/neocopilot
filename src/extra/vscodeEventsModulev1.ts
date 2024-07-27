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
          this.predictionDelay = 300; // Reseting time to 300ms for code precompletion diction

          // Action in case if prediction already exist
          if (this.mainSuggestion && this.tempSuggestion){
            console.log('============================= Suggestion Exists =============================')

            // Check if text is deleted or not
            if (this.updatedText === ""){
              console.log('============================= Text Deleted ==================================')

              // Check if text is deleted or updated in same line or not
              if (this.currentStartLineNumber === currentEndtLineNumber){

                console.log("=================== Text Deleted in the Same Line ===========================")
                let positionChange = currentEndCharacterPosition - this.currentStartCharacterPosition;
                this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                if (this.tempSuggestion){
                  return null;
                }
                // else{
                //   this.mainSuggestion = ""
                //   this.tempSuggestion = ""
                //   if (positionChange > 2){this.predictionDelay = 5000;}else{this.predictionDelay = 3000;}
                // }
              }

              // Check if text is deleted or updated in different line
              if (this.currentStartLineNumber !== currentEndtLineNumber){
                console.log("=================== Text Deleted in the Different Line =======================")
                this.tempSuggestion = "";
                this.mainSuggestion = "";
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                this.predictionDelay = 30000;
              }
            }
          }else{
            console.log('============================= No Suggestion Exists =============================')
            if (this.updatedText == ""){
              console.log('============================= Text Deleted ==================================')
              this.predictionDelay = 3000;
              
              if (this.currentStartLineNumber === currentEndtLineNumber){
                console.log("=================== Text Deleted in the Same Line ===========================")
                if (currentEndCharacterPosition - this.currentStartCharacterPosition > 2){
                  this.predictionDelay = 10000;
                }
              }else{
                console.log("Text Deleted or Updated in the Different Line")
                this.predictionDelay = 15000;
              }
            }else{
              console.log('============================= Text Updated ==================================')
              this.predictionDelay = 500;
              if (this.currentStartLineNumber != currentEndtLineNumber){
                this.predictionDelay = 5000;
              }
            }
          }

          // Action in case if prediction does not exist and not text is deleted
          if (!this.mainSuggestion){

            // Clearing debounce for prediction
            if (this.debounceTimeout) {
              clearTimeout(this.debounceTimeout);
            }

            // Checking if editor is active or not and going for prediction
            if (editor && event.document === editor.document) {
              this.debounceTimeout = setTimeout(() => {

                if (vscode.window.activeTextEditor) {
                    this.userTempString = "";
                    this.mainSuggestion = "";
                    this.tempSuggestion = "";
                    this.mainListSuggestion = [];
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

            let updatedTextLength = this.updatedText.length;

            // Check if updated text is in the temp suggestion and is less then the length of the actual tempsugesstions length
            if (this.tempSuggestion.startsWith(this.updatedText) && updatedTextLength < this.tempSuggestion.length){
                // Update the suugestion after removing the left string
                console.log("Suggestion is trimmed to update ans show")
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(updatedTextLength));
                this.userTempString = this.removeSubstringFromEnd(this.mainSuggestion, this.tempSuggestion.slice(updatedTextLength))

            }else{
              // Check in other messages if suggestion exists or not
              this.userTempString = this.userTempString + this.updatedText;
              console.log("Searching this String to Update Suggestion - ", this.userTempString)
              this.mainSuggestion = this.findFirstMatch(this.mainListSuggestion,this.mainSuggestion, this.userTempString)
              
              if (this.mainSuggestion){
                console.log("Updated Suggestion Found")
                this.tempSuggestion = this.mainSuggestion.slice(this.userTempString.length);
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
              }else{
                console.log("Updated Suggestion Not Found")
                this.userTempString = "";
                this.mainSuggestion = "";
                this.tempSuggestion = "";
                this.mainListSuggestion = [];
                this.socketModule.completionProvider.updateSuggestion("");
                if (this.debounceTimeout) {
                  clearTimeout(this.debounceTimeout);
                }
                if (vscode.window.activeTextEditor) {
                  setTimeout(() => {
                    this.uniqueIdentifier = uuidv4();
                    this.socketModule.emitMessage(this.uniqueIdentifier, 
                      getTextBeforeCursor(vscode.window.activeTextEditor), 
                      getTextAfterCursor(vscode.window.activeTextEditor),
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

  public findFirstMatch(mainListSuggestion: string[], mainSuggestion: string, subStr: string): string {
    // remove main suggestion from mainSuggestionList
    if (mainSuggestion) {
      mainListSuggestion = mainListSuggestion.filter(item => item !== mainSuggestion);
    }
    
    for (let item of mainListSuggestion) {
      if (item.startsWith(subStr)) {
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