// src/vscodeEventsModule.ts
import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleActiveEditor, handleAllOpenEditors, handleAllOpenFiles } from "../utilities/codeCompletionUtils/editorUtils";
import { getCompleteEditorText, getTextAfterCursor, getTextBeforeCursor, getCursorPosition } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace, notSupportedFiles, modifySuggestion } from "../utilities/codeCompletionUtils/completionUtils";
import { handleAddedSpecialCharacters, getDeletedText } from "../utilities/codeCompletionUtils/completionUtils";
import { removeSubstringFromEnd, findFirstMatch } from "../utilities/codeCompletionUtils/completionUtils";
import { StatusBarManager } from '../StatusBarManager';
import { Socket } from 'socket.io-client';

export class VscodeEventsModule {
  private socketModule: SocketModule;
  private timeout: NodeJS.Timeout | undefined;
  private textAfterCursor: string = ""; // Text after cursor sent to Backend
  private textBeforeCursor: string = ""; // Text before cursor sent to Frontend
  private currentSelectedFileName: string | null = "";
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileNotSupported: boolean = false
  private currentLanguage: string = "";
  private currentStartLineNumber: number = -1;
  private currentStartCharacterPosition: number = -1;
  private currentEndLineNumber: number = -1;
  private currentEndCharacterPosition: number = -1;
  private updatedText: string = "";
  private mainSuggestion: string = "";
  private tempSuggestion: string = "";
  private mainListSuggestion: string[] = [];
  public uniqueIdentifier: string = uuidv4();
  private disablePrediction: boolean = false;
  private predictionDelay: number = 300;
  private predictionWaitText: string = "";
  private userTempString: string = "";
  private typeOfAction: string = "";
  private previousText: string = "";
  private currentText: string = "";
  private specialCharacters: string[];
  private deleteSpecialCharacters: string[];
  private previousPositionState: { startLine: number; startCharacter: number; endLine: number; endCharacter: number } | null = null;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.specialCharacters = ['(', '{', '[', '"', "'"];
    this.deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
    this.typeOfAction = "emit-request";
    this.previousPositionState = null;
    this.predictionWaitText = "";
    this.mainSuggestion = "";
    this.tempSuggestion = "";
    this.mainListSuggestion = [];
  }

  public reinitialize(): void {
    this.socketModule.completionProvider.updateSuggestion("");
    this.mainSuggestion = "";
    this.socketModule.predictionWaitText = "";
    this.mainListSuggestion = [];
    this.socketModule.predictionRequestInProgress = false;
    this.predictionDelay = 300;
  }

  public eventPostionVariables(event: vscode.TextDocumentChangeEvent): void {
    const range = event.contentChanges[0].range;
    this.currentStartLineNumber = range.start.line; // Line number of the text that is changed
    this.currentStartCharacterPosition = range.start.character; // Character position of the text that is changed
    this.updatedText = event.contentChanges[0].text // Text that is changed
    this.currentEndLineNumber = range.end.line; // Line number of the text that is changed
    this.currentEndCharacterPosition = range.end.character; // Character position of the text that is changed
    this.textAfterCursor = getTextAfterCursor(vscode.window.activeTextEditor);
  }

  public handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    if (this.socketModule.socket ){

      // Update the suggestion parameters to make sure they always remain updated
      this.mainSuggestion = this.socketModule.suggestion;
      this.tempSuggestion = this.socketModule.completionProvider.suggestion;
      this.mainListSuggestion = this.socketModule.socketListSuggestion;

      // Check in Case if Prediction is Already in Progress
      if(!this.socketModule.rateLimitExceeded){
        this.previousText = this.currentText;
        this.textPredictionHandeling(vscode.window.activeTextEditor, event);
      }

    }else{
      this.reinitialize()
      this.socketModule.rateLimitExceeded = false;
      const currentVersion = context.extension.packageJSON.version;
      const socketConnection: Socket = this.socketModule.connect(currentVersion);
    }
  }

  private textPredictionHandeling(editor: vscode.TextEditor | undefined, event: vscode.TextDocumentChangeEvent): string | null {

    try { 
          if (this.isFileNotSupported){ // Cheking if File is Supported or not
            this.reinitialize();
            return null;
          }

          // console.log("====================== Starting the process =========================")
          this.currentText = getCompleteEditorText(vscode.window.activeTextEditor) // Getting editor texts for prediction
          this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor); // Getting text before cursor for prediction
          this.currentLanguage = event.document.languageId; // Language of the file
          if (!this.currentLanguage){this.currentLanguage = 'neo-defined'}

          if (isNullOrEmptyOrWhitespace(this.textBeforeCursor)){ // strip white spaces from current text
            this.socketModule.completionProvider.updateSuggestion("");
            return null;
          }

          if (event.contentChanges.length > 1){ // If there are more than one changes in the editor
            const multipleChange = event.contentChanges[0].text
            if (["// " , "# "].includes(multipleChange)){
              this.reinitialize();
              return null;
            }
            return null;
          }

          this.predictionDelay = 300; // Reseting time to 300ms for code precompletion diction
          this.eventPostionVariables(event); // Getting the position of the text that is changed

          if (this.socketModule.predictionRequestInProgress){ // If prediction is already in progress
            if (this.updatedText){
              this.predictionWaitText = this.predictionWaitText + this.updatedText;
              this.socketModule.predictionWaitText = this.predictionWaitText;
              // console.log("Prediction Wait Text: ", this.predictionWaitText);
            }else{
              // console.log("Text is deleted");
              let deletedText = getDeletedText( this.previousText, this.currentStartLineNumber, this.currentStartCharacterPosition, 
                this.currentEndLineNumber, this.currentEndCharacterPosition);
              if (this.predictionWaitText.endsWith(deletedText)){
                this.predictionWaitText = this.predictionWaitText.slice(0, -deletedText.length);
                // console.log("Prediction Wait Text: ", this.predictionWaitText);
                this.socketModule.predictionWaitText = this.predictionWaitText;
              }else{
                this.predictionWaitText = "";
                this.socketModule.predictionWaitText = "";
                this.socketModule.isSuggestionRequired = false;
              }
            }
            return null;
          }else{
            this.predictionWaitText = "";
            this.socketModule.predictionWaitText = "";
          }

          if (this.mainSuggestion && this.tempSuggestion){ // Action in case if prediction already exist

            if (this.updatedText === "" || !this.updatedText){ // Check if text is deleted or not

                // Get deleted text from the editor
                const deletedText = getDeletedText( 
                  this.previousText, 
                  this.currentStartLineNumber, 
                  this.currentStartCharacterPosition, 
                  this.currentEndLineNumber, 
                  this.currentEndCharacterPosition
                );
                console.log("Deleted Text: ", deletedText)
              if (this.currentStartLineNumber === this.currentEndLineNumber){ // Check if text is deleted or updated in same line or not

                if (deletedText.length===2 && this.deleteSpecialCharacters.includes(deletedText)){
                  // console.log(" ====================== In case of special characters are deleted ================================")
                  if (this.userTempString.endsWith(deletedText)){
                    this.userTempString = this.userTempString.substring(0, this.userTempString.length - 2);
                    this.tempSuggestion = this.mainSuggestion.slice(this.userTempString.length);
                    this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                    return null;
                  }
                }

                let positionChange = this.currentEndCharacterPosition - this.currentStartCharacterPosition;
                this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                // console.log("Temp Suggestion: ", this.tempSuggestion);
                if (this.tempSuggestion){
                  return null;
                }else{
                  this.reinitialize()
                  this.predictionDelay = 4000;
                  this.typeOfAction = "NEO-SE-D-LC-1";
                }
              }

              // Check if text is deleted or updated in different line
              if (this.currentStartLineNumber !== this.currentEndLineNumber){
                if (this.mainSuggestion.endsWith(deletedText + this.tempSuggestion)){
                  this.tempSuggestion = deletedText + this.tempSuggestion;
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                  return null;
                } else if(this.currentEndLineNumber - this.currentStartLineNumber < 2){
                  this.reinitialize()
                  this.predictionDelay = 15000;
                  this.typeOfAction = "NEO-SE-D-LC-X";
                }else{
                  this.reinitialize()
                  return null;
                }

              }
            }
          }else{
            this.reinitialize()
            // console.log('============================= No Suggestion Exists =============================')
            // When no suggestion exists in the editor
            if (this.updatedText == "" || !this.updatedText){

              // console.log('============================= Text Deleted ==================================')
              this.predictionDelay = 3000;
              
              if (this.currentStartLineNumber === this.currentEndLineNumber){

                // console.log("=================== Text Deleted in the Same Line ===========================")
                if (this.currentEndCharacterPosition - this.currentStartCharacterPosition > 2){
                  this.predictionDelay = 8000;
                  this.typeOfAction = "NEO-SNE-D-LC-1";

                }
              }else{
                // console.log("Text Deleted or Updated in the Different Line")
                this.predictionDelay = 15000;
                this.typeOfAction = "NEO-SNE-D-LC-X";

              }
            }else{

              // console.log('============================= Text Updated ==================================')
              this.predictionDelay = 300;
              this.typeOfAction = "NEO-SNE-A-LC-1";
              if (this.updatedText == "\n" || this.updatedText == "\r\n"){
                this.predictionDelay = 300;
              } else if(this.updatedText.includes("\n") || this.updatedText.includes("\r\n")){
                this.predictionDelay = 5000;
                this.typeOfAction = "NEO-SNE-A-LC-X";
              }
            }
          }

          // Action in case if prediction does not exist and not text is deleted
          if (!this.mainSuggestion){
            // console.log("============================= No Suggestion Exists =============================")

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
                    // console.log(getCursorPosition(vscode.window.activeTextEditor))
                    this.socketModule.startTime = performance.now();
                    this.socketModule.emitMessage(this.uniqueIdentifier, 
                      getTextBeforeCursor(vscode.window.activeTextEditor), 
                      getTextAfterCursor(vscode.window.activeTextEditor), 
                      this.typeOfAction,
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
                // console.log("Suggestion is trimmed to update ans show")
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(updatedTextLength));
                this.userTempString = removeSubstringFromEnd(this.mainSuggestion, this.tempSuggestion.slice(updatedTextLength))
                this.socketModule.chatCompletionMessage(
                    "partial_completion", 
                    "-",
                    updatedTextLength
                )
            }else if(this.specialCharacters.includes(this.updatedText[0]) && this.updatedText.length == 2 && this.tempSuggestion.startsWith(this.updatedText[0])){

              // Check for special characters in the suggestion
              // console.log("Special Character is present in the suggestion")
              const outputSuggestion = handleAddedSpecialCharacters(this.mainSuggestion, this.tempSuggestion, this.updatedText);
              if (outputSuggestion){
                this.tempSuggestion = outputSuggestion;
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                this.userTempString = this.userTempString + this.updatedText;
                this.socketModule.chatCompletionMessage(
                  "partial_completion", 
                  "special_character",
                  updatedTextLength
                )
                return null;
              }
            }
            else{
              // Check in other messages if suggestion exists or not
              const logCharCodes = (str: string) => str.split('').map(char => char.charCodeAt(0));

              if (this.normalizeNewlines(this.updatedText)===this.normalizeNewlines(this.mainSuggestion)){
                this.socketModule.chatCompletionMessage("complete_completion",  "main", updatedTextLength)
              }else if (this.normalizeNewlines(this.updatedText)===this.normalizeNewlines(this.tempSuggestion)){
                this.socketModule.chatCompletionMessage("complete_completion",  "partial", updatedTextLength)
              }

              this.userTempString = this.userTempString + this.updatedText;
              // console.log("Searching this String to Update Suggestion - ", this.userTempString)
              this.mainSuggestion = findFirstMatch(this.mainListSuggestion,this.mainSuggestion, this.userTempString)

              if (this.mainSuggestion){
                // console.log("Updated Suggestion Found")
                this.tempSuggestion = this.mainSuggestion.slice(this.userTempString.length);
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                this.socketModule.chatCompletionMessage("search_completion", "found", this.tempSuggestion.length)
              }else{
                // console.log("Updated Suggestion Not Found")
                this.userTempString = "";
                this.mainSuggestion = "";
                this.tempSuggestion = "";
                this.mainListSuggestion = [];
                this.socketModule.completionProvider.updateSuggestion("");
                if (this.debounceTimeout) {
                  clearTimeout(this.debounceTimeout);
                }
                if (editor && event.document === editor.document) {
                // if (vscode.window.activeTextEditor) {
                  // console.log(getCursorPosition(vscode.window.activeTextEditor))

                  this.debounceTimeout = setTimeout(() => {
                      if (vscode.window.activeTextEditor) {
                      this.uniqueIdentifier = uuidv4();
                      this.socketModule.startTime = performance.now();
                      this.socketModule.emitMessage(this.uniqueIdentifier, 
                        getTextBeforeCursor(vscode.window.activeTextEditor), 
                        getTextAfterCursor(vscode.window.activeTextEditor),
                        this.typeOfAction,
                        this.currentLanguage
                      );
                    }
                  }, this.predictionDelay);
                }
              }
            }
          }
          // console.log(getCursorPosition(vscode.window.activeTextEditor))
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
          // // console.log(`File Not Supported: ${this.isFileNotSupported}`);
          this.socketModule.completionProvider.updateSuggestion("");
        }, 100);
      } catch (error) {
    } 
  }

  // Utility function to normalize newlines
  private normalizeNewlines(text: string): string {
    return text.replace(/\r\n/g, '\n');
  }
}