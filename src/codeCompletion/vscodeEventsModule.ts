// src/vscodeEventsModule.ts
import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleActiveEditor, handleAllOpenEditors, handleAllOpenFiles } from "../utilities/codeCompletionUtils/editorUtils";
import { getCompleteEditorText, getTextAfterCursor, getTextBeforeCursor, getCursorPosition } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace, notSupportedFiles, modifySuggestion } from "../utilities/codeCompletionUtils/completionUtils";
import { handleAddedSpecialCharacters, getDeletedText } from "../utilities/codeCompletionUtils/completionUtils";
import { removeSubstringFromEnd, searchSuggestion } from "../utilities/codeCompletionUtils/completionUtils";
import { StatusBarManager } from '../StatusBarManager';
import { Socket } from 'socket.io-client';

export class VscodeEventsModule {

  private socketModule: SocketModule;
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
  private predictionDelay: number = 400;
  private predictionWaitText: string = "";
  private userTempString: string = "";
  private typeOfAction: string = "";
  private previousText: string = "";
  private currentText: string = "";
  private specialCharacters: string[];
  private deleteSpecialCharacters: string[];
  private storedCursorPosition: vscode.Position = new vscode.Position(0, 0);
  public isDisabled15Minutes: boolean = false; 

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.specialCharacters = ['(', '{', '[', '"', "'"];
    this.deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
    this.typeOfAction = "EMIT-REQUEST";
    this.mainListSuggestion = [];
  }

  public reinitialize(comment: string = ""): void {
    // if (comment){console.log(comment);}
    this.socketModule.completionProvider.updateSuggestion("");
    this.mainSuggestion = "";
    this.socketModule.predictionWaitText = "";
    this.mainListSuggestion = [];
    this.socketModule.predictionRequestInProgress = false;
    this.predictionWaitText = ""
    this.predictionDelay = 400;
    this.userTempString = ""
  }

  public eventPostionVariables(event: vscode.TextDocumentChangeEvent): Boolean {
    try{
      const range = event.contentChanges[0].range;
      this.currentStartLineNumber = range.start.line; // Line number of the text that is changed
      this.currentStartCharacterPosition = range.start.character; // Character position of the text that is changed
      this.updatedText = event.contentChanges[0].text // Text that is changed
      this.currentEndLineNumber = range.end.line; // Line number of the text that is changed
      this.currentEndCharacterPosition = range.end.character; // Character position of the text that is changed
      return true;
    }catch(error){
      // console.log(JSON.stringify(event.contentChanges[0]))
      return false;
    }
  }

  public async handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    if (!this.isDisabled15Minutes){
      if (this.socketModule.socket?.connected){

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
        await this.socketModule.connect(currentVersion, context);
      }
    }
  }

  private textPredictionHandeling(editor: vscode.TextEditor | undefined, event: vscode.TextDocumentChangeEvent): string | null {

    try { 
          // console.log("NeoCopilot: Text Prediction Handeling")
          if (this.isFileNotSupported){ // Cheking if File is Supported or not
            this.reinitialize();
            return null;
          }

          this.currentText = getCompleteEditorText(vscode.window.activeTextEditor) // Getting complete editor texts for prediction
          this.textBeforeCursor = getTextBeforeCursor(vscode.window.activeTextEditor);
          this.currentLanguage = event.document.languageId || 'neo-defined';

          const reason = event.reason; // Checking reason for update
          if (reason === vscode.TextDocumentChangeReason.Undo){
            this.reinitialize()
            return null;
          }else if(reason === vscode.TextDocumentChangeReason.Redo){
            this.reinitialize()
            return null;
          }else{

          }

          if (isNullOrEmptyOrWhitespace(this.textBeforeCursor)){ // strip white spaces from current text
            this.reinitialize();
            return null;
          }

          if (event.contentChanges.length > 1){ // If there are more than one changes in the editor
            const multipleChange = event.contentChanges[0].text
            if (["// " , "# "].includes(multipleChange)){
              this.reinitialize();
              return null;
            }
            this.reinitialize();
            return null;
          }

          this.predictionDelay = 400; // Reseting time to 400ms for code precompletion diction
          if (!this.eventPostionVariables(event)){return null;}

          // Process to follow in case of prediction in going on
          if (this.socketModule.predictionRequestInProgress){
            this.handlePredictionInProgress();
            return null;
          } else {
            this.predictionWaitText = "";
            this.socketModule.predictionWaitText = "";
          }

          if (this.mainSuggestion && this.tempSuggestion){ // Action in case if prediction already exist

            if (this.isTextDeleted()){ // Check if text is deleted or not
              const deletedText = getDeletedText( // Get deleted text from the editor
                this.previousText, this.currentStartLineNumber, this.currentStartCharacterPosition, 
                this.currentEndLineNumber, this.currentEndCharacterPosition
              );

              if (this.currentStartLineNumber === this.currentEndLineNumber){ // Check if text is deleted or updated in same line or not
                if (this.handleSameLineDeletion(deletedText)) {
                  return null;
                }
              }
              if (this.currentStartLineNumber !== this.currentEndLineNumber){ // Check if text is deleted or updated in different line
                if (this.handleMultiLineDeletion(deletedText)) {
                  return null;
                }
              }
            }
            
          }else{  // When no suggestion exists in the editor
            this.reinitialize()
            if (this.isTextDeleted()){this.handleAllDeletion()}else{
              this.handleAllUpdation()
            }
          }

          if (!this.mainSuggestion){ // Action in case if prediction does not exist and not text is deleted
            if (this.debounceTimeout) {clearTimeout(this.debounceTimeout);} // Clearing debounce for prediction
            if (editor && event.document === editor.document) { // Checking if editor is active or not and going for prediction
              this.sendForPrediction()
            }
          }else{
            let updatedTextLength = this.updatedText.length;

            // Check for special characters
            if (this.deleteSpecialCharacters.includes(this.updatedText)){
              if ((this.socketModule.previousText + this.mainSuggestion).startsWith(this.textBeforeCursor+this.updatedText[0])) {
                const outputSuggestion = handleAddedSpecialCharacters(this.mainSuggestion, this.tempSuggestion, this.updatedText);
                if (outputSuggestion){
                  this.tempSuggestion = outputSuggestion;
                  this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                  this.socketModule.chatCompletionMessage("partial_completion", "special_character", updatedTextLength)
                  return null;
                }
              }
            } else if((this.socketModule.previousText + this.mainSuggestion).startsWith(this.textBeforeCursor+this.updatedText)){
              // console.log("Text Update")
              if (updatedTextLength < this.tempSuggestion.length){
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion.slice(updatedTextLength));
                this.socketModule.chatCompletionMessage("partial_completion", "-", updatedTextLength)
                return null;
              } else if(updatedTextLength === this.mainSuggestion.length){
                this.socketModule.completionProvider.updateSuggestion("");
                this.socketModule.chatCompletionMessage("complete_completion",  "main", updatedTextLength)
              } else if(updatedTextLength === this.tempSuggestion.length){
                this.socketModule.completionProvider.updateSuggestion("");
                this.socketModule.chatCompletionMessage("complete_completion",  "partial", updatedTextLength)
              } 
            }else{
              this.reinitialize();
            }

              [this.mainSuggestion, this.tempSuggestion] = searchSuggestion(this.mainListSuggestion, this.socketModule.previousText, this.textBeforeCursor, this.updatedText)
              if (this.mainSuggestion){
                this.socketModule.suggestion = this.mainSuggestion
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                this.socketModule.chatCompletionMessage("search_completion", "found", this.tempSuggestion.length)
              }else{
                if (this.debounceTimeout) {clearTimeout(this.debounceTimeout);}
                if (editor && event.document === editor.document) {
                  this.sendForPrediction()
                }
              }
          }
        return null;
    } catch (Error) {
        this.socketModule.customInformationMessage('vscode_module:textPredictionHandeling', JSON.stringify(Error));
        // console.log("This error", Error);
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
            StatusBarManager.updateMessage(`$(error) Neo Copilot`);
            this.isFileNotSupported = true;
          }else{
            StatusBarManager.updateMessage(`$(check) Neo Copilot`);
            this.isFileNotSupported = false;
          }
          // // console.log(`File Not Supported: ${this.isFileNotSupported}`);
          this.socketModule.completionProvider.updateSuggestion("");
        }, 100);
      } catch (error) {
        this.socketModule.customInformationMessage('vscode_module:getCurrentFileName', JSON.stringify(error));
        // console.log(error);
    } 
  }

  // Handle Running Predictions
  private handlePredictionInProgress(): string | null {
      if (this.updatedText) {
          this.predictionWaitText += this.updatedText;
          this.socketModule.predictionWaitText = this.predictionWaitText;
      } else {
          const deletedText = getDeletedText(
              this.previousText,
              this.currentStartLineNumber,
              this.currentStartCharacterPosition,
              this.currentEndLineNumber,
              this.currentEndCharacterPosition
          );
          if (this.predictionWaitText.endsWith(deletedText)) {
              this.predictionWaitText = this.predictionWaitText.slice(0, -deletedText.length);
              this.socketModule.predictionWaitText = this.predictionWaitText;
          } else {
              this.predictionWaitText = "";
              this.socketModule.predictionWaitText = "";
              this.socketModule.isSuggestionRequired = false;
          }
      }
      return null;
  }

  // ============== Text delete functinality ==================
  private isTextDeleted(): boolean {
    return this.updatedText === "" || !this.updatedText;
  }

  // Handle delete when suggestion exists
  private handleSameLineDeletion(deletedText: string): boolean {
    // console.log("Handle Single Line Text Deletion")

    if ((this.socketModule.previousText + this.mainSuggestion).slice(0, -this.tempSuggestion.length) === (this.textBeforeCursor + deletedText)){
        if (deletedText.length === 2 && this.deleteSpecialCharacters.includes(deletedText)) {
          if (this.userTempString.endsWith(deletedText)) {
              this.userTempString = this.userTempString.substring(0, this.userTempString.length - 2);
              this.tempSuggestion = this.mainSuggestion.slice(this.userTempString.length);
              this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
              return true; // Exit early as suggestion was successfully updated
          }
      }
  
      const positionChange = this.currentEndCharacterPosition - this.currentStartCharacterPosition;
      this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);
      this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
  
      if (this.tempSuggestion) {
          return true; // Exit early as suggestion was successfully updated
      } else {
          this.reinitialize();
          this.predictionDelay = 4000;
          this.typeOfAction = "NEO-SE-D-LC-1";
      }
    }else{
      this.reinitialize();
      this.predictionDelay = 4000;
      this.typeOfAction = "NEO-SE-D-LC-1";
    }
    return false; // Continue processing if suggestion cannot be updated
  }

  // Handle delete when suggestion exists
  private handleMultiLineDeletion(deletedText: string): boolean {
    if ((this.socketModule.previousText + this.mainSuggestion).slice(0, -this.tempSuggestion.length) === (this.textBeforeCursor + deletedText)){

      // console.log("Handle Multiple Line Text Deletion")
      if (this.mainSuggestion.endsWith(deletedText + this.tempSuggestion)) {
          this.tempSuggestion = deletedText + this.tempSuggestion;
          this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
          return true; // Exit early as suggestion was successfully updated
      } else if (this.currentEndLineNumber - this.currentStartLineNumber < 2) {
          this.reinitialize();
          this.predictionDelay = 15000;
          this.typeOfAction = "NEO-SE-D-LC-X";
      } else {
          this.reinitialize();
          return true; // Exit as suggestion cannot be updated
      }
      // console.log("Text Multiple Deleted - ", this.predictionDelay)
    }else{
      this.reinitialize();
      this.predictionDelay = 4000;
      this.typeOfAction = "NEO-SE-D-LC-X";
    }
    return false; // Continue processing if necessary
  }

  // Handle delete when no Suggestion exists
  private handleAllDeletion(): void {
    this.predictionDelay = 3000;
    if (this.currentStartLineNumber === this.currentEndLineNumber){
      if (this.currentEndCharacterPosition - this.currentStartCharacterPosition > 2){
        this.predictionDelay = 8000;
        this.typeOfAction = "NEO-SNE-D-LC-1";
      }
    }else{
      // console.log("Text Deleted or Updated in the Different Line")
      this.predictionDelay = 15000;
      this.typeOfAction = "NEO-SNE-D-LC-X";
    }
    // console.log("Text Deleted - ", this.predictionDelay)
  }

  // Handle Update when no Suggestion Exists
  private handleAllUpdation(): void {
    this.predictionDelay = 400;
    this.typeOfAction = "NEO-SNE-A-LC-1";
    if (this.updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\n" || this.updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\r\n") {
        this.predictionDelay = 1000;
    } else if (this.updatedText.includes("\n") || this.updatedText.includes("\r\n")) {
        this.predictionDelay = 5000;
        this.typeOfAction = "NEO-SNE-A-LC-X";
    }
    // console.log("Text Added - ", this.predictionDelay)
  }

  // Send data for prediction
  private sendForPrediction(): void {
    this.debounceTimeout = setTimeout(() => {
      if (vscode.window.activeTextEditor) {
          this.reinitialize()
          this.uniqueIdentifier = uuidv4();
          this.socketModule.startTime = performance.now();
          if (this.textBeforeCursor+this.updatedText != getTextBeforeCursor(vscode.window.activeTextEditor)){
            // console.log("Previous text is not same")
            this.reinitialize()
            return null;
          }else{
            // console.log("Previous text is same")
            this.socketModule.emitMessage(this.uniqueIdentifier, 
              getTextBeforeCursor(vscode.window.activeTextEditor), 
              getTextAfterCursor(vscode.window.activeTextEditor), 
              this.typeOfAction,
              this.currentLanguage
            );
          }

      }
    }, this.predictionDelay);
  }

  public disableFor15Minutes(): void {
    this.isDisabled15Minutes = true;
    StatusBarManager.updateMessage(`$(x) Neo Copilot`);
    this.socketModule.customInformationMessage("code-completion-disabled", "15min")
    console.info("%cNeo Copilot: Code completion disabled(15min)", 'color: red;');
    setTimeout(() => {
      this.isDisabled15Minutes = false;
      StatusBarManager.updateMessage(`$(check) Neo Copilot`);
      this.socketModule.customInformationMessage("code-completion-enabled", "15min")
      console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
    }, 15 * 60 * 1000);
  }

  public enableCodeCompletion(): void {
    this.isDisabled15Minutes = false;
    this.socketModule.customInformationMessage("code-completion-enabled", "manually")
    StatusBarManager.updateMessage(`$(check) Neo Copilot`);
    console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
  }

  // Utility function to normalize newlines
  private normalizeNewlines(text: string): string {
    return text.replace(/\r\n/g, '\n');
  }
}