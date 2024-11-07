// src/update/UpdateActionHandler.ts
import * as vscode from 'vscode';
import { SocketModule } from '../../socketModule';
import { SuggestionManager } from '../../codeCompletion/SuggestionManager';
import { handleAddedSpecialCharacters, searchSuggestion } from "../../utilities/codeCompletionUtils/completionUtils";

export class UpdateHandler {
  private socketModule: SocketModule;
  private suggestionManager: SuggestionManager;
  private debounceTimeout: NodeJS.Timeout | undefined;

  constructor(socketModule: SocketModule, suggestionManager: SuggestionManager) {
    this.socketModule = socketModule;
    this.suggestionManager = suggestionManager;
  }

  public handleUpdateWhenPredictionExists(
    event: vscode.TextDocumentChangeEvent,
    editor: vscode.TextEditor | undefined,
    updatedText: string,
    currentLanguage: string
  ): void {
    // console.log("Trying to update suggestion based on the text change");
    let updatedTextLength = updatedText.length;

    // Handle special character insertion
    if (this.handleSpecialCharacterInsertion(updatedText, updatedTextLength)) {
      return;
    }

    let matchCase: string = this.handleSuggestionUpdate(updatedText, updatedTextLength);

    if (matchCase === "CASE2" || matchCase === "CASE3" || matchCase === "CASE4") {
      if (!this.searchAndUpdateSuggestion(updatedText)) {
        // If no suggestion is found, send for prediction
        this.suggestionManager.reinitialize();
        if (editor && event.document === editor.document) {
          this.suggestionManager.sendForPrediction(updatedText, currentLanguage);
        }
      }
    }
  }

//   public handleUpdateWhenNoPrediction(
//     updatedText: string,
//     currentLanguage: string,
//     event: vscode.TextDocumentChangeEvent,
//     editor: vscode.TextEditor | undefined
//   ): void {
//     // console.log("Prediction when no suggestion exists");
//     this.handleAllUpdation(updatedText);
//   }

  public handlePredictionInProgress(updatedText: string): void {
    if (updatedText) {
      this.suggestionManager.predictionWaitText += updatedText;
      this.socketModule.predictionWaitText = this.suggestionManager.predictionWaitText;
    } else {
      // Handle text deletion during prediction
      this.suggestionManager.predictionWaitText = "";
      this.socketModule.predictionWaitText = "";
      this.socketModule.isSuggestionRequired = false;
    }
  }

  private handleSpecialCharacterInsertion(
    updatedText: string,
    updatedTextLength: number
  ): boolean {
    // console.log("Handle Special Character Insertion");
    if (this.suggestionManager.deleteSpecialCharacters.includes(updatedText)) {
      // console.log("Character falls in Special Characters");
      if (
        (this.socketModule.previousText + this.suggestionManager.mainSuggestion).startsWith(
          this.suggestionManager.textBeforeCursor + updatedText[0])
        ) {
        // console.log("Suggestion also has special character");
        const outputSuggestion = handleAddedSpecialCharacters(
          this.suggestionManager.mainSuggestion,
          this.suggestionManager.tempSuggestion,
          updatedText
        );
        if (outputSuggestion) {
          this.suggestionManager.tempSuggestion = outputSuggestion;
          this.socketModule.completionProvider.updateSuggestion(
            this.suggestionManager.tempSuggestion
          );
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

  private handleSuggestionUpdate(updatedText: string, updatedTextLength: number): string {
    if (
      (this.socketModule.previousText + this.suggestionManager.mainSuggestion).startsWith(
        this.suggestionManager.textBeforeCursor + updatedText)
    ) {
      if (updatedTextLength < this.suggestionManager.tempSuggestion.length) {
        // console.log("User Partially Accepted the Suggestion");
        this.suggestionManager.tempSuggestion = this.suggestionManager.tempSuggestion.slice(updatedTextLength);
        this.socketModule.completionProvider.updateSuggestion(this.suggestionManager.tempSuggestion);
        this.socketModule.chatCompletionMessage("partial_completion", "-", updatedTextLength);
        return "CASE1";
      } else if (updatedTextLength === this.suggestionManager.mainSuggestion.length) {
        // console.log("User Accepted the complete Suggestion");
        this.socketModule.completionProvider.updateSuggestion("");
        this.socketModule.chatCompletionMessage("complete_completion", "main", updatedTextLength);
        return "CASE2";
      } else if (updatedTextLength === this.suggestionManager.tempSuggestion.length) {
        // console.log("User Accepted the partial Suggestion");
        this.socketModule.completionProvider.updateSuggestion("");
        this.socketModule.chatCompletionMessage("complete_completion", "partial", updatedTextLength);
        return "CASE3";
      }
    }
    return "CASE4";
  }

  private searchAndUpdateSuggestion(updatedText: string): boolean {
    // console.log("[INFO] searchAndUpdateSuggestion called with updatedText:", updatedText);

    const previousText = this.socketModule.previousText;
    const textBeforeCursor = this.suggestionManager.textBeforeCursor;

    // console.log("[DEBUG] Previous text:", previousText);
    // console.log("[DEBUG] Text before cursor:", textBeforeCursor);

    // Attempting to search for suggestions
    let [mainSuggestion, tempSuggestion] = searchSuggestion(
      this.suggestionManager.mainListSuggestion,
      previousText,
      textBeforeCursor,
      updatedText
    );

    // Log the suggestions found
    // console.log("[DEBUG] Main suggestion:", mainSuggestion);
    // console.log("[DEBUG] Temp suggestion:", tempSuggestion);
    // console.log("[DEBUG] List suggestion:", this.suggestionManager.mainListSuggestion);

    if (mainSuggestion) {
      // Updating socket module with suggestions
      this.suggestionManager.mainSuggestion = mainSuggestion;
      this.socketModule.suggestion = mainSuggestion;
      this.suggestionManager.tempSuggestion = tempSuggestion;
      this.socketModule.completionProvider.updateSuggestion(tempSuggestion);
      this.socketModule.chatCompletionMessage("search_completion", "found", tempSuggestion.length);

      // console.log("[INFO] Suggestion found and updated. Temp suggestion length:", tempSuggestion.length);
      return true;
    }

    // console.log("[WARN] No suggestion found.");
    return false;
  }

  public handleUpdateWhenNoPrediction(updatedText: string): void {
    // console.log("Handling update when no suggestion exists");
    this.suggestionManager.predictionDelay = 400;
    this.suggestionManager.typeOfAction = "NEO-SNE-A-LC-1";
    
    if (updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\n" || updatedText.replace(/^[ \t]+|[ \t]+$/g, '') === "\r\n") {
      // console.log("User went to next line in editor");
      this.suggestionManager.predictionDelay = 1000;
    } else if (updatedText.includes("\n") || updatedText.includes("\r\n")) {
      this.suggestionManager.typeOfAction = "NEO-SNE-A-LC-X";
      this.suggestionManager.predictionDelay = 7000;
      // console.log("User went to multiple lines");
    }
  }
}
