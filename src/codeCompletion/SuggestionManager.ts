// src/SuggestionManager.ts
import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { getTextAfterCursor, getTextBeforeCursor } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace, modifySuggestion, handleAddedSpecialCharacters, searchSuggestion } from "../utilities/codeCompletionUtils/completionUtils";
import { getDeletedText } from "../utilities/codeCompletionUtils/completionUtils";
import { v4 as uuidv4 } from 'uuid';

export class SuggestionManager {
  private socketModule: SocketModule;
  private textBeforeCursor: string = ""; // Text before cursor sent to Frontend
  private mainSuggestion: string = "";
  private tempSuggestion: string = "";
  private mainListSuggestion: string[] = [];
  private predictionWaitText: string = "";
  private userTempString: string = "";
  private typeOfAction: string = "";
  private specialCharacters: string[];
  private deleteSpecialCharacters: string[];
  public uniqueIdentifier: string = uuidv4();
  private debounceTimeout: NodeJS.Timeout | undefined;
  private predictionDelay: number = 300;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.specialCharacters = ['(', '{', '[', '"', "'"];
    this.deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
    this.typeOfAction = "EMIT-REQUEST";
    this.mainListSuggestion = [];
  }

  public reinitialize(): void {
    this.socketModule.completionProvider.updateSuggestion("");
    this.mainSuggestion = "";
    this.socketModule.predictionWaitText = "";
    this.mainListSuggestion = [];
    this.socketModule.predictionRequestInProgress = false;
    this.predictionWaitText = "";
    this.userTempString = "";
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
      console.log("============ NeoCopilot: Text Prediction Handling ===============");
      if (isNullOrEmptyOrWhitespace(currentText) || !editor) { // strip white spaces from current text
        console.log("Input text is short");
        this.reinitialize();
        return;
      }

      const reason = event.reason;
      switch (reason) {
        case vscode.TextDocumentChangeReason.Undo:
          console.log("User has undone changes");
          // FutureLogs: Add handeling when user has predicted changes: Priority Low
          this.reinitialize();
          return;
        case vscode.TextDocumentChangeReason.Redo:
          console.log("User has redo changes");
          this.reinitialize();
          // FutureLogs: Add handeling when user has predicted changes: Priority Low
          return;
      }

      if (event.contentChanges.length > 1) { // If there are more than one changes in the editor
        console.log("More than one changes in the editor");
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

      // Check in Case if Prediction is Already in Progress
      if (this.socketModule.predictionRequestInProgress) {
        console.log("Prediction is in progress");
        this.handlePredictionInProgress(updatedText);
        return;
      } else {
        console.log("Prediction is not in progress");
        this.predictionWaitText = "";
        this.socketModule.predictionWaitText = "";
      }

      if (this.mainSuggestion && this.tempSuggestion) { // Action in case if prediction already exists
        
        console.log("Prediction already exists");
        if (this.isTextDeleted(updatedText)) { // Check if text is deleted or not
          console.log("Text is deleted");
          const deletedText = getDeletedText( // Get deleted text from the editor
            previousText, currentStartLineNumber, currentStartCharacterPosition,
            currentEndLineNumber, currentEndCharacterPosition
          );
          console.log("Deleted Text:", deletedText);

          if (currentStartLineNumber === currentEndLineNumber) { // Check if text is deleted or updated in same line or not
            console.log("Text is deleted in same line");
            if (this.handleSameLineDeletion(
              deletedText, 
              previousText, 
              currentStartLineNumber, 
              currentStartCharacterPosition, 
              currentEndLineNumber, 
              currentEndCharacterPosition
            )) {
              return;
            }
          }
          if (currentStartLineNumber !== currentEndLineNumber) { // Check if text is deleted or updated in different line
            console.log("Text is deleted in multiple lines");
            if (this.handleMultiLineDeletion(
              deletedText, 
              previousText
            )) {
              return;
            }
          }
        }

      } else {  // When no suggestion exists in the editor
        console.log("Prediction does not exist");
        this.reinitialize();
        if (this.isTextDeleted(updatedText)) {
          this.handleAllDeletion(
            currentStartLineNumber, 
            currentEndLineNumber,
            currentEndCharacterPosition,
            currentStartCharacterPosition
        );
        } else {
          this.handleAllUpdation(updatedText);
        }
      }

      if (!this.mainSuggestion) { 
        // Action in case if prediction does not exist and text is not deleted
        if (editor && event.document === editor.document) { 
            // Checking if editor is active or not and going for prediction
            this.sendForPrediction(updatedText, currentLanguage);
        }
      } else {
        console.log("Trying to update suggestion based on the text change")
        let updatedTextLength = updatedText.length;

        // Handle special character insertion
        if (this.handleSpecialCharacterInsertion(updatedText, updatedTextLength)) {
            return;
        }

        let matchCase: string = this.handleSuggestionUpdate(
          updatedText,
          updatedTextLength
        )

        if (matchCase==="CASE2" || matchCase==="CASE3" || matchCase==="CASE4") {
          if (!this.searchAndUpdateSuggestion(updatedText)) {
            // If no suggestion is found, send for prediction
            this.reinitialize()
            if (editor && event.document === editor.document) {
              this.sendForPrediction(updatedText, currentLanguage);
            }
          }
        }
      }

    } catch (Error) {
      this.socketModule.customInformationMessage('SuggestionManager:handleTextChange', JSON.stringify(Error));
      // console.log("This error", Error);
    }
  }

    // New function to handle special character insertion
    private handleSpecialCharacterInsertion(
      updatedText: string, 
      updatedTextLength: number
    ): boolean {
      console.log("Hanlde Special Character Insertion")
        if (this.deleteSpecialCharacters.includes(updatedText)) {
          console.log("Character fall in Special Charater")
          if (
            (this.socketModule.previousText + this.mainSuggestion).startsWith(
              this.textBeforeCursor + updatedText[0])
            ) {
              console.log("Suggestion also have special character")
              const outputSuggestion = handleAddedSpecialCharacters(
                  this.mainSuggestion, 
                  this.tempSuggestion, 
                  updatedText
              );
              if (outputSuggestion) {
                this.tempSuggestion = outputSuggestion;
                this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
                this.socketModule.chatCompletionMessage(
                  "partial_completion", 
                  "special_character", 
                  updatedTextLength
                );
                return true;
              }
          }
        }
        return false;
    }

// New function to handle suggestion updates based on the updated text
    private handleSuggestionUpdate(updatedText: string, updatedTextLength: number): string {
        if (
            (this.socketModule.previousText + this.mainSuggestion).startsWith(
            this.textBeforeCursor + updatedText)
           ) {
          if (updatedTextLength < this.tempSuggestion.length) {
              console.log("User Partially Accepted the Suggestion")
              this.tempSuggestion = this.tempSuggestion.slice(updatedTextLength);
              this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
              this.socketModule.chatCompletionMessage("partial_completion", "-", updatedTextLength);
              return "CASE1";
          } else if (updatedTextLength === this.mainSuggestion.length) {
              console.log("User Accepted the complete Suggestion")
              this.socketModule.completionProvider.updateSuggestion("");
              this.socketModule.chatCompletionMessage("complete_completion", "main", updatedTextLength);
              return "CASE2";
          } else if (updatedTextLength === this.tempSuggestion.length) {
              console.log("User Accepted the partial Suggestion")
              this.socketModule.completionProvider.updateSuggestion("");
              this.socketModule.chatCompletionMessage("complete_completion", "partial", updatedTextLength);
              return "CASE3";
          }
        }
        return "CASE4";
    }

  // New function to search for a suggestion and update it
  private searchAndUpdateSuggestion(updatedText: string): boolean {
      
    console.log("[INFO] searchAndUpdateSuggestion called with updatedText:", updatedText);
    
    const previousText = this.socketModule.previousText;
    const textBeforeCursor = this.textBeforeCursor;

    console.log("[DEBUG] Previous text:", previousText);
    console.log("[DEBUG] Text before cursor:", textBeforeCursor);

    // Attempting to search for suggestions
    [this.mainSuggestion, this.tempSuggestion] = searchSuggestion(
        this.mainListSuggestion,
        previousText,
        textBeforeCursor,
        updatedText
    );
    
    // Log the suggestions found
    console.log("[DEBUG] Main suggestion:", this.mainSuggestion);
    console.log("[DEBUG] Temp suggestion:", this.tempSuggestion);
    console.log("[DEBUG] List suggestion:", this.mainListSuggestion);

    if (this.mainSuggestion) {
        // Updating socket module with suggestions
        this.socketModule.suggestion = this.mainSuggestion;
        this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
        this.socketModule.chatCompletionMessage("search_completion", "found", this.tempSuggestion.length);

        console.log("[INFO] Suggestion found and updated. Temp suggestion length:", this.tempSuggestion.length);
        return true;
    }

    console.log("[WARN] No suggestion found.");
    return false;
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

  // ============== Text delete functionality ==================
  private isTextDeleted(updatedText: string): boolean {
    return updatedText === "" || !updatedText;
  }

  // Handle delete when suggestion exists
  private handleSameLineDeletion(
    deletedText: string,
    previousText: string,
    currentStartLineNumber: number,
    currentStartCharacterPosition: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number
  ): boolean {
    // Check if the deletion context is valid
    if (!this.isDeletionContextValid(deletedText)) {
        console.log("Location Not Verified for Deletion")
        this.reinitialize();
        return false;
    }
    console.log("Location Verified for Deletion")
    // Handle special character deletion (e.g., '()', '{}', etc.)
    if (this.handleSpecialCharacterDeletion(deletedText)) {
      console.log("Handled Special Characters")
      return true; // Successfully handled special character deletion
    }

    // Handle regular deletion
    const positionChange = currentEndCharacterPosition - currentStartCharacterPosition;
    return this.handleRegularDeletion(positionChange);
  }

    private isDeletionContextValid(deletedText: string): boolean {
        // Location verification Before and After Text Deletion
        const previousFullText = this.socketModule.previousText + this.mainSuggestion;
        const tempSuggestionLength = this.tempSuggestion.length;
        const deletedTextLength = deletedText.length;

        // Calculate the expected text before cursor
        const expectedTextBeforeCursor = previousFullText.slice(0, -tempSuggestionLength - deletedTextLength);
        const currentTextWithDeleted = this.textBeforeCursor;

        console.log("Previous Full Text:", previousFullText);
        console.log("Expected Text Before Cursor:", expectedTextBeforeCursor);
        console.log("Current Text With Deleted:", currentTextWithDeleted);

        return expectedTextBeforeCursor === currentTextWithDeleted;
    }

    private handleSpecialCharacterDeletion(deletedText: string): boolean {
        // Check if the deleted text is a pair of special characters
        if (deletedText.length === 2 && this.deleteSpecialCharacters.includes(deletedText)) {
            // Recompute tempSuggestion based on current text
    
            const previousText = this.socketModule.previousText;
            const mainSuggestion = this.mainSuggestion;
    
            // Current text before cursor
            const currentText = this.textBeforeCursor;
    
            // Calculate the accepted part of mainSuggestion
            const acceptedSuggestion = currentText.substring(previousText.length);
    
            // Compute the new tempSuggestion
            this.tempSuggestion = mainSuggestion.substring(acceptedSuggestion.length);
    
            // Update the suggestion in the editor
            this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
            console.log("**************************************")
            console.log("previousText", previousText)
            console.log("mainSuggestion", mainSuggestion)
            console.log("currentText", currentText)
            console.log("acceptedSuggestion", acceptedSuggestion)
            console.log("this.tempSuggestion", this.tempSuggestion)
            return true; // Successfully handled special character deletion
        }
        return false; // Not a special character deletion or could not handle
    }
    

  private handleRegularDeletion(positionChange: number): boolean {
    // Adjust the tempSuggestion based on the number of characters deleted
    this.tempSuggestion = modifySuggestion(this.mainSuggestion, this.tempSuggestion, positionChange);

    // Update the suggestion in the editor
    this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);

    if (this.tempSuggestion) {
      return true; // Successfully updated the suggestion
    } else {
      // If tempSuggestion is empty or null, reinitialize
      this.reinitialize();
      this.predictionDelay = 2000;
      return false;
    }
  }


  private handleMultiLineDeletion(deletedText: string, previousText: string): boolean {
    // Check if the deletion context is valid
    if (!this.isDeletionContextValid(deletedText)) {
        console.log("Location Not Verified for Deletion");
        this.reinitialize();
        return false;
    }
    console.log("Location Verified for Deletion");

      console.log("Handle Multiple Line Text Deletion");
      if (this.mainSuggestion.endsWith(deletedText + this.tempSuggestion)) {
        console.log("Suggestion ends with deleted text + temp suggestion");
        this.tempSuggestion = deletedText + this.tempSuggestion;
        this.socketModule.completionProvider.updateSuggestion(this.tempSuggestion);
        return true; // Exit early as suggestion was successfully updated
      } else {
        this.reinitialize();
        return true; // Exit as suggestion cannot be updated
      }
    }

//   // Handle delete when no Suggestion exists
//   private handleAllDeletion(currentStartLineNumber: number, currentEndLineNumber: number): void {
//     if (currentStartLineNumber === currentEndLineNumber) {
//       if (currentEndLineNumber - currentStartLineNumber > 2) {
//         this.typeOfAction = "NEO-SNE-D-LC-1";
//       }
//     } else {
//       // console.log("Text Deleted or Updated in the Different Line")
//       this.typeOfAction = "NEO-SNE-D-LC-X";
//     }
//     // console.log("Text Deleted")
//   }

    private handleAllDeletion(
        currentStartLineNumber: number, 
        currentEndLineNumber: number,
        currentEndCharacterPosition: number,
        currentStartCharacterPosition: number,
    ): void {

        this.predictionDelay = 2000;
        if (currentStartLineNumber === currentEndLineNumber){
            if (currentEndCharacterPosition - currentStartCharacterPosition > 2){
                this.predictionDelay = 5000;
                this.typeOfAction = "NEO-SNE-D-LC-1";
            }
        }else{
        // console.log("Text Deleted or Updated in the Different Line")
        this.predictionDelay = 10000;
        this.typeOfAction = "NEO-SNE-D-LC-X";
        }
        // console.log("Text Deleted - ", this.predictionDelay)
    }

    // Handle Update when no Suggestion Exists
    private handleAllUpdation(updatedText: string): void {
        console.log("Prediction when no sugeestion exisits")
        this.predictionDelay = 400;
        this.typeOfAction = "NEO-SNE-A-LC-1";
        if (updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\n" || updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\r\n") {
            console.log("User Went to next Line in editor")
            this.predictionDelay = 1000;
        } else if (updatedText.includes("\n") || updatedText.includes("\r\n")) {
            this.typeOfAction = "NEO-SNE-A-LC-X";
            this.predictionDelay = 3000;
            console.log("User went to multiple Lines")
        } 
    // console.log("Text Added")
    }

  // Send data for prediction
  private sendForPrediction(updatedText: string, currentLanguage: string): void {
    // Clear any existing debounce timeout
    if (this.debounceTimeout) {
      console.log("Time Cleared Out")
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
          console.log("Special Character Deleted")
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText[0];
        }else{
          expectedTextBeforeCursor = this.textBeforeCursor + updatedText;
        }
        console.log("Expected Text Before Cursor: ", expectedTextBeforeCursor)

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
