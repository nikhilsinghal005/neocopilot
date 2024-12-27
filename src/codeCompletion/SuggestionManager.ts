// src/codeCompletion/SuggestionManager.ts

import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { getTextBeforeCursor, getTextAfterCursor } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace, getDeletedText, searchSuggestion } from "../utilities/codeCompletionUtils/completionUtils";
import { v4 as uuidv4 } from 'uuid';
import { DeletionHandler } from '../codeCompletion/handleActions/deleteActionHandler';
import { UpdateHandler } from '../codeCompletion/handleActions/updateActionHandler';
import { CompletionProviderModule } from '../codeCompletion/completionProviderModule';
import { VscodeEventsModule } from '../codeCompletion/vscodeEventsModule';
import { CompletionSocketManager } from '../codeCompletion/completionSocketManager';

/**
 * Manages suggestions based on user interactions and predictions.
 */
export class SuggestionManager {
  // Singleton instances of modules
  private socketModule: SocketModule;
  private completionProviderModule: CompletionProviderModule;
  private completionSocketManager: CompletionSocketManager;

  // Handlers for deletion and updates
  private deleteActionHandler: DeletionHandler;
  private updateActionHandler: UpdateHandler;

  // Suggestion Parameters
  public mainSuggestion: string = "";
  public tempSuggestion: string = "";
  public mainListSuggestion: string[] = [];

  // Editor Content Parameters
  private isTextDeleted: boolean = false;
  public textBeforeCursor: string = "";
  public updatedText: string = "";

  // Action Parameters
  public typeOfAction: string = "";
  public specialCharacters: string[];
  public deleteSpecialCharacters: string[];

  // Debounce Mechanism
  private debounceTimeout: NodeJS.Timeout | undefined;
  public predictionDelay: number = 50;

  // Tracking Text States
  public previousText: string = "";

  /**
   * Initializes the SuggestionManager with necessary handlers and modules.
   * @param vscodeEventsModule Instance of VscodeEventsModule.
   */
  constructor(private vscodeEventsModule: VscodeEventsModule) {
    this.socketModule = SocketModule.getInstance();
    this.completionProviderModule = CompletionProviderModule.getInstance();
    this.completionSocketManager = CompletionSocketManager.getInstance();

    this.specialCharacters = ['(', '{', '[', '"', "'"];
    this.deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
    this.typeOfAction = "EMIT-REQUEST";
    this.mainListSuggestion = [];

    this.deleteActionHandler = new DeletionHandler(this);
    this.updateActionHandler = new UpdateHandler(this);
  }

  /**
   * Reinitializes the suggestion parameters to their default states.
   */
  public reinitialize(): void {
    this.completionProviderModule.updateSuggestion("");
    this.mainSuggestion = "";
    this.completionSocketManager.predictionWaitText = "";
    this.mainListSuggestion = [];
    this.completionSocketManager.predictionRequestInProgress = false;
    this.completionSocketManager.predictionWaitText = "";
  }

  /**
   * Handles text changes in the editor and manages suggestions accordingly.
   * @param event Text document change event.
   * @param editor Active text editor.
   * @param currentStartLineNumber Starting line number of the change.
   * @param currentStartCharacterPosition Starting character position of the change.
   * @param currentEndLineNumber Ending line number of the change.
   * @param currentEndCharacterPosition Ending character position of the change.
   */
  public handleTextChange(
    event: vscode.TextDocumentChangeEvent,
    editor: vscode.TextEditor | undefined,
    currentStartLineNumber: number,
    currentStartCharacterPosition: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number,
  ): void {
    try {
      // Validate input text and editor presence
      if (isNullOrEmptyOrWhitespace(this.vscodeEventsModule.currentText) || !editor) {
        //console.log("Input text is short or editor is undefined.");
        this.reinitialize();
        return;
      }

      // Handle Undo and Redo actions
      const reason = event.reason;
      if (reason === vscode.TextDocumentChangeReason.Undo || reason === vscode.TextDocumentChangeReason.Redo) {
        //console.log(`User performed a ${reason === vscode.TextDocumentChangeReason.Undo ? 'Undo' : 'Redo'} action.`);
        this.reinitialize();
        return;
      }

      // Handle multiple content changes
      if (event.contentChanges.length > 1) {
        //console.log("Multiple content changes detected.");
        this.reinitialize();
        return;
      }

      // Update suggestion parameters to ensure they are current
      this.mainSuggestion = this.completionSocketManager.suggestion;
      this.tempSuggestion = this.completionProviderModule.suggestion;
      this.mainListSuggestion = this.completionSocketManager.socketListSuggestion;

      this.textBeforeCursor = getTextBeforeCursor(editor);
      this.updatedText = event.contentChanges[0].text;
      this.isTextDeleted = this.updatedText === "" || !this.updatedText;

      // If text is deleted, determine the deleted text
      if (this.isTextDeleted) {
        this.updatedText = getDeletedText(
          this.vscodeEventsModule.previousText,
          currentStartLineNumber,
          currentStartCharacterPosition,
          currentEndLineNumber,
          currentEndCharacterPosition
        );
      }

      //console.log("Updated Text:", this.updatedText);

      // Check if a prediction is already in progress
      if (this.completionSocketManager.predictionRequestInProgress) {
        //console.log("Prediction is in progress.");
        this.handlePredictionInProgress(this.updatedText, this.isTextDeleted);
        return;
      } else {
        this.completionSocketManager.predictionWaitText = "";
        this.completionSocketManager.isSuggestionRequired = true;
      }

      // Action when prediction exists
      if (this.mainSuggestion && this.tempSuggestion) { 
        //console.log("Prediction already exists.");
        
        // Check if text is deleted
        if (this.isTextDeleted) { 
          //console.log("Deleted Text:", this.updatedText);
          const isDeletionValid = this.deleteActionHandler.handleDeletion(
            this.updatedText,
            currentStartLineNumber,
            currentStartCharacterPosition,
            currentEndLineNumber,
            currentEndCharacterPosition
          );
          //console.log("Is Deletion Valid:", isDeletionValid);

          if (isDeletionValid) {
            return;
          }
        }
      } else {
        // When no suggestion exists in the editor
        this.reinitialize();
        if (this.isTextDeleted) {
          // Optionally handle all deletions if needed
          // this.deleteActionHandler.handleAllDeletion(
          //   currentStartLineNumber, 
          //   currentEndLineNumber,
          //   currentEndCharacterPosition,
          //   currentStartCharacterPosition
          // );
          return;
        } else {
          this.updateActionHandler.handleUpdateWhenNoPrediction(this.updatedText);
        }
      }

      if (!this.mainSuggestion) { 
        // Action in case if prediction does not exist
        if (editor && editor.document === event.document) {
          this.sendForPrediction(this.updatedText, this.vscodeEventsModule.currentLanguage);
        }
      } else {
        // Update suggestions when prediction exists
        this.updateActionHandler.handleUpdateWhenPredictionExists(
          event,
          editor,
          this.updatedText,
          this.vscodeEventsModule.currentLanguage
        );
      }

    } catch (error) {
      console.error("Error in handleTextChange:", error);
      this.socketModule.customInformationMessage(
        'SuggestionManager:handleTextChange', 
        JSON.stringify(error)
      );
      this.reinitialize();
    }
  }

  /**
   * Handles scenarios when a prediction is already in progress.
   * @param updatedText The text that was updated.
   * @param isTextDeleted Indicates if the text was deleted.
   */
  private handlePredictionInProgress(updatedText: string, isTextDeleted: boolean): void {
    if (isTextDeleted) {
      if (this.completionSocketManager.predictionWaitText && this.completionSocketManager.predictionWaitText.endsWith(updatedText)) {
        this.completionSocketManager.predictionWaitText = this.completionSocketManager.predictionWaitText.substring(0, this.completionSocketManager.predictionWaitText.length - updatedText.length);
      } else {
        this.completionSocketManager.predictionWaitText = "";
        this.completionSocketManager.isSuggestionRequired = false;
      }
    } else {
      this.completionSocketManager.predictionWaitText += updatedText;
    }
  }

  /**
   * Sends the current text for prediction.
   * @param updatedText The text that was updated.
   * @param currentLanguage The current programming language.
   */
  public sendForPrediction(updatedText: string, currentLanguage: string): void {
    //console.log("============ NeoCopilot: Prediction Request ===============");
    
    // Clear any existing debounce timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  
    // Set a new debounce timeout
    this.debounceTimeout = setTimeout(() => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        // Reinitialize suggestion manager
        this.reinitialize();
        this.completionSocketManager.startTime = performance.now();

        // Determine expected text before cursor
        let expectedTextBeforeCursor: string;
        if (this.deleteSpecialCharacters.includes(updatedText)) {
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText[0];
        } else {
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText;
        }

        // Validate the current text before cursor
        if (expectedTextBeforeCursor !== getTextBeforeCursor(editor)) {
          this.reinitialize();
          return;
        } else {
          // Emit the prediction request
          this.completionSocketManager.attachSocketListeners();
          this.completionSocketManager.emitMessage(
            uuidv4(),
            getTextBeforeCursor(editor),
            getTextAfterCursor(editor),
            this.typeOfAction,
            currentLanguage
          );
        }
      }
    }, this.predictionDelay);
  }
}
