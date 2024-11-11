// src/SuggestionManager.ts
import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { getTextBeforeCursor, getTextAfterCursor } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace } from "../utilities/codeCompletionUtils/completionUtils";
import { getDeletedText } from "../utilities/codeCompletionUtils/completionUtils";
import { v4 as uuidv4 } from 'uuid';
import { DeletionHandler } from '../codeCompletion/handleActions/deleteActionHandler';
import { UpdateHandler } from '../codeCompletion/handleActions/updateActionHandler';

export class SuggestionManager {
  private socketModule: SocketModule;
  public textBeforeCursor: string = ""; // Text before cursor sent to Frontend
  private deleteActionHandler: DeletionHandler;
  private updateActionHandler: UpdateHandler;
  public mainSuggestion: string = "";
  public tempSuggestion: string = "";
  public mainListSuggestion: string[] = [];
  public predictionWaitText: string = "";
  public typeOfAction: string = "";
  public specialCharacters: string[];
  public deleteSpecialCharacters: string[];
  public uniqueIdentifier: string = uuidv4();
  private debounceTimeout: NodeJS.Timeout | undefined;
  public predictionDelay: number = 300;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.specialCharacters = ['(', '{', '[', '"', "'"];
    this.deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
    this.typeOfAction = "EMIT-REQUEST";
    this.mainListSuggestion = [];
    this.deleteActionHandler = new DeletionHandler(socketModule, this);
    this.updateActionHandler = new UpdateHandler(socketModule, this);
  }

  public reinitialize(): void {
    this.socketModule.completionProvider.updateSuggestion("");
    this.mainSuggestion = "";
    this.socketModule.predictionWaitText = "";
    this.mainListSuggestion = [];
    this.socketModule.predictionRequestInProgress = false;
    this.predictionWaitText = "";
  }

  public handleTextChange(
    event: vscode.TextDocumentChangeEvent,
    editor: vscode.TextEditor | undefined,
    currentText: string,
    previousText: string,
    currentStartLineNumber: number,
    currentStartCharacterPosition: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number,
    updatedText: string,
    currentLanguage: string
  ): void {
    try {
      // console.log("============ NeoCopilot: Text Prediction Handling ===============");
      if (isNullOrEmptyOrWhitespace(currentText) || !editor) { // strip white spaces from current text
        // console.log("Input text is short");
        this.reinitialize();
        return;
      }

      const reason = event.reason;
      switch (reason) {
        case vscode.TextDocumentChangeReason.Undo:
          // console.log("User has undone changes");
          // FutureLogs: Add handling when user has predicted changes: Priority Low
          this.reinitialize();
          return;
        case vscode.TextDocumentChangeReason.Redo:
          // console.log("User has redo changes");
          this.reinitialize();
          // FutureLogs: Add handling when user has predicted changes: Priority Low
          return;
      }

      if (event.contentChanges.length > 1) { // If there are more than one changes in the editor
        // console.log("More than one changes in the editor");
        const multipleChange = event.contentChanges[0].text;
        if (["// ", "# "].includes(multipleChange)) {
          this.reinitialize();
          return;
        }
        this.reinitialize();
        return;
      }

      this.textBeforeCursor = getTextBeforeCursor(editor);
      // Update the suggestion parameters to make sure they always remain updated
      this.mainSuggestion = this.socketModule.suggestion;
      this.tempSuggestion = this.socketModule.completionProvider.suggestion;
      this.mainListSuggestion = this.socketModule.socketListSuggestion;

      // Check if Prediction is Already in Progress
      if (this.socketModule.predictionRequestInProgress) {
        // console.log("Prediction is in progress");
        this.handlePredictionInProgress(updatedText);
        return;
      } else {
        // console.log("Prediction is not in progress");
        this.predictionWaitText = "";
        this.socketModule.predictionWaitText = "";
      }

      // Action when prediction exists
      if (this.mainSuggestion && this.tempSuggestion) { 

          // console.log("Prediction already exists");
          // Check if text is deleted or not
          if (this.deleteActionHandler.isTextDeleted(updatedText)) { 

            // console.log("Text is deleted");
            const deletedText = getDeletedText( 
              previousText, 
              currentStartLineNumber, 
              currentStartCharacterPosition,
              currentEndLineNumber, 
              currentEndCharacterPosition
            );

            // console.log("Deleted Text:", deletedText);
            this.deleteActionHandler.handleDeletion(
              deletedText,
              currentStartLineNumber,
              currentStartCharacterPosition,
              currentEndLineNumber,
              currentEndCharacterPosition
            );
          }

      } else {
          // When no suggestion exists in the editor
          // console.log("Prediction does not exist");
          this.reinitialize();
          if (this.deleteActionHandler.isTextDeleted(updatedText)) {
              this.deleteActionHandler.handleAllDeletion(
                currentStartLineNumber, 
                currentEndLineNumber,
                currentEndCharacterPosition,
                currentStartCharacterPosition
              );
          } else {
              this.updateActionHandler.handleUpdateWhenNoPrediction(
                  updatedText
              );
          }
      }

      if (!this.mainSuggestion) { 
        // Action in case if prediction does not exist
        if (editor && editor.document === event.document) {
          this.sendForPrediction(updatedText, currentLanguage);
        }

      } else {
        // console.log("Text is updated");
        this.updateActionHandler.handleUpdateWhenPredictionExists(
            event,
            editor,
            updatedText,
            currentLanguage
        );
      }

    } catch (Error) {
      // console.log("Error:", Error)
      this.socketModule.customInformationMessage(
        'SuggestionManager:handleTextChange', 
        JSON.stringify(Error)
      );
      this.reinitialize();
    }
  }

  // Handle Running Predictions
  private handlePredictionInProgress(updatedText: string): void {
    if (updatedText) {
        this.predictionWaitText += updatedText;
        this.socketModule.predictionWaitText = this.predictionWaitText;
    } else {
        // Handle text deletion during prediction
        this.predictionWaitText = "";
        this.socketModule.predictionWaitText = "";
        this.socketModule.isSuggestionRequired = false;
    }
  }

  // Send data for prediction
  public sendForPrediction(updatedText: string, currentLanguage: string): void {
    // Clear any existing debounce timeout
    if (this.debounceTimeout) {
      // console.log("Time Cleared Out")
      clearTimeout(this.debounceTimeout);
    }
  
    // Set a new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      if (vscode.window.activeTextEditor) {

        // Reinitialize suggestion manager
        this.reinitialize();
        this.uniqueIdentifier = uuidv4();
        this.socketModule.startTime = performance.now();

        // Check if the text before cursor is the same as the expected text before cursor
        let expectedTextBeforeCursor: string;
        if (this.deleteSpecialCharacters.includes(updatedText)) {
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText[0];
        }else{
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText;
        }

        if (expectedTextBeforeCursor !== getTextBeforeCursor(vscode.window.activeTextEditor)) {
          this.reinitialize();
          return;
        } else {
          // Emit the prediction request
          this.socketModule.emitMessage(
            this.uniqueIdentifier,
            getTextBeforeCursor(vscode.window.activeTextEditor),
            getTextAfterCursor(vscode.window.activeTextEditor),
            this.typeOfAction,
            currentLanguage
          );
        }
      }
    }, this.predictionDelay);
  }
}  
