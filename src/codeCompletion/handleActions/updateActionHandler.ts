// src/update/UpdateActionHandler.ts

import * as vscode from 'vscode';
import { SuggestionManager } from '../../codeCompletion/SuggestionManager';
import { handleAddedSpecialCharacters, searchSuggestion } from "../../utilities/codeCompletionUtils/completionUtils";
import { CompletionProviderModule } from '../../codeCompletion/completionProviderModule';
import { CompletionSocketManager } from '../../codeCompletion/completionSocketManager';

/**
 * Handles update actions related to code completions and suggestions.
 */
export class UpdateHandler {
  private suggestionManager: SuggestionManager;
  private completionProviderModule: CompletionProviderModule;
  private completionSocketManager: CompletionSocketManager;

  /**
   * Initializes the UpdateHandler with necessary modules.
   * @param suggestionManager Instance of SuggestionManager.
   */
  constructor(suggestionManager: SuggestionManager) {
    this.suggestionManager = suggestionManager;
    this.completionProviderModule = CompletionProviderModule.getInstance();
    this.completionSocketManager = CompletionSocketManager.getInstance();
  }

  /**
   * Handles updates when a prediction exists.
   * @param event Text document change event.
   * @param editor Active text editor.
   * @param updatedText Text that was updated.
   * @param currentLanguage Current programming language.
   */
  public handleUpdateWhenPredictionExists(
    event: vscode.TextDocumentChangeEvent,
    editor: vscode.TextEditor | undefined,
    updatedText: string,
    currentLanguage: string
  ): void {
    //console.log("Attempting to update suggestion based on the text change.");
    const updatedTextLength = updatedText.length;

    // Handle special character insertion first
    if (this.handleSpecialCharacterInsertion(updatedText, updatedTextLength)) {
      return;
    }

    // Handle suggestion updates and determine the match case
    const matchCase: string = this.handleSuggestionUpdate(updatedText, updatedTextLength);
    //console.log(`Match Case: ${matchCase}`);

    if (["CASE2", "CASE3", "CASE4"].includes(matchCase)) {
      if (!this.searchAndUpdateSuggestion(updatedText)) {
        // If no matching suggestion is found, reinitialize and send a new prediction request
        this.suggestionManager.reinitialize();
        if (editor && event.document === editor.document) {
          this.suggestionManager.sendForPrediction(updatedText, currentLanguage);
        }
      }
    }
  }

  /**
   * Handles the scenario when no prediction exists.
   * @param updatedText Text that was updated.
   */
  public handleUpdateWhenNoPrediction(updatedText: string): void {
    // Adjust prediction delay based on the type of text change
    this.suggestionManager.predictionDelay = 100;
    this.suggestionManager.typeOfAction = "NEO-SNE-A-LC-1";

    const trimmedText = updatedText.replace(/^[ \t]+|[ \t]+$/g, '');
    if (trimmedText === "\n" || trimmedText === "\r\n") {
      // User moved to the next line in the editor
      this.suggestionManager.predictionDelay = 100;
      //console.log("User performed a single-line edit");
    } else if (updatedText.includes("\n") || updatedText.includes("\r\n")) {
      // User performed a multi-line edit
      this.suggestionManager.typeOfAction = "NEO-SNE-A-LC-X";
      this.suggestionManager.predictionDelay = 7000;
      //console.log("User performed a multi-line edit.");
    }
  }

  /**
   * Handles the insertion of special characters and updates suggestions accordingly.
   * @param updatedText Text that was updated.
   * @param updatedTextLength Length of the updated text.
   * @returns Whether the special character insertion was handled.
   */
  private handleSpecialCharacterInsertion(
    updatedText: string,
    updatedTextLength: number
  ): boolean {

    //console.log("Attempting to handle special character insertion.");
    if (this.suggestionManager.deleteSpecialCharacters.includes(updatedText)) {

      const {mainSuggestion, tempSuggestion, textBeforeCursor} = this.suggestionManager;
      //console.log("Special character deletion detected.");
      //console.log(`Main Suggestion: ${mainSuggestion}`);
      //console.log(`Temp Suggestion: ${tempSuggestion}`);
      //console.log(`Text Before Cursor: ${textBeforeCursor}`);
      //console.log(`Updated Text: ${updatedText}`);

      const expectedStartText = this.completionSocketManager.previousText + mainSuggestion;
      const actualStartText = textBeforeCursor + updatedText[0];

      if (expectedStartText.startsWith(actualStartText)) {
        const updatedSuggestion = handleAddedSpecialCharacters(
          mainSuggestion,
          tempSuggestion,
          updatedText
        );

        if (updatedSuggestion) {
          this.suggestionManager.tempSuggestion = updatedSuggestion;
          this.completionProviderModule.updateSuggestion(updatedSuggestion);
          this.completionSocketManager.chatCompletionMessage(
            "partial_completion",
            "special_character",
            updatedTextLength
          );
          //console.log("Handled special character deletion and updated suggestion.");
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Handles the update of suggestions based on the updated text.
   * @param updatedText Text that was updated.
   * @param updatedTextLength Length of the updated text.
   * @returns The case identifier indicating the type of match.
   */
  private handleSuggestionUpdate(updatedText: string, updatedTextLength: number): string {
    const expectedStartText = this.completionSocketManager.previousText + this.suggestionManager.mainSuggestion;
    const actualStartText = this.suggestionManager.textBeforeCursor + updatedText;

    if (expectedStartText.startsWith(actualStartText)) {
      if (updatedTextLength < this.suggestionManager.tempSuggestion.length) {
        // User partially accepted the suggestion
        this.suggestionManager.tempSuggestion = this.suggestionManager.tempSuggestion.slice(updatedTextLength);
        this.completionProviderModule.updateSuggestion(this.suggestionManager.tempSuggestion);
        this.completionSocketManager.chatCompletionMessage("partial_completion", "-", updatedTextLength);
        return "CASE1";
      } else if (updatedTextLength === this.suggestionManager.mainSuggestion.length) {
        // User accepted the complete suggestion
        this.completionProviderModule.updateSuggestion("");
        this.completionSocketManager.chatCompletionMessage("complete_completion", "main", updatedTextLength);
        return "CASE2";
      } else if (updatedTextLength === this.suggestionManager.tempSuggestion.length) {
        // User accepted a partial suggestion
        this.completionProviderModule.updateSuggestion("");
        this.completionSocketManager.chatCompletionMessage("complete_completion", "partial", updatedTextLength);
        return "CASE3";
      }
    }
    return "CASE4";
  }

  /**
   * Searches for matching suggestions and updates them if found.
   * @param updatedText Text that was updated.
   * @returns Whether a matching suggestion was found and updated.
   */
  private searchAndUpdateSuggestion(updatedText: string): boolean {
    const previousText = this.completionSocketManager.previousText;
    const textBeforeCursor = this.suggestionManager.textBeforeCursor;

    const [mainSuggestion, tempSuggestion] = searchSuggestion(
      this.suggestionManager.mainListSuggestion,
      previousText,
      textBeforeCursor,
      updatedText
    );

    if (mainSuggestion) {
      // Update suggestions
      this.suggestionManager.mainSuggestion = mainSuggestion;
      this.suggestionManager.tempSuggestion = tempSuggestion;
      this.completionProviderModule.updateSuggestion(tempSuggestion);
      this.completionSocketManager.chatCompletionMessage("search_completion", "found", tempSuggestion.length);

      //console.log("Suggestion found and updated.");
      return true;
    }

    //console.log("No matching suggestion found.");
    return false;
  }
}
