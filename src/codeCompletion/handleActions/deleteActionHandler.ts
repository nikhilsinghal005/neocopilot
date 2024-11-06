// src/deletion/DeletionHandler.ts
import * as vscode from 'vscode';
import { SocketModule } from '../../socketModule';
import { SuggestionManager } from '../SuggestionManager';
import { getDeletedText } from "../../utilities/codeCompletionUtils/completionUtils";
import { modifySuggestion, handleAddedSpecialCharacters } from "../../utilities/codeCompletionUtils/completionUtils";

export class DeletionHandler {
  private socketModule: SocketModule;
  private suggestionManager: SuggestionManager;

  constructor(socketModule: SocketModule, suggestionManager: SuggestionManager) {
    this.socketModule = socketModule;
    this.suggestionManager = suggestionManager;
  }

  public isTextDeleted(updatedText: string): boolean {
    return updatedText === "" || !updatedText;
  }

  public handleDeletion(
    deletedText: string,
    currentStartLineNumber: number,
    currentStartCharacterPosition: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number
  ): boolean {
    if (currentStartLineNumber === currentEndLineNumber) {
        return this.handleSameLineDeletion(
            deletedText, 
            currentStartCharacterPosition, 
            currentEndCharacterPosition
        );
    } else {
        return this.handleMultiLineDeletion(
            deletedText
        );
    }
  }

  private handleSameLineDeletion(
    deletedText: string,
    currentStartCharacterPosition: number,
    currentEndCharacterPosition: number
  ): boolean {

    if (!this.isDeletionContextValid(deletedText)) {
      console.log("Location Not Verified for Deletion");
      this.suggestionManager.reinitialize();
      return false;
    }
    console.log("Location Verified for Deletion");

    if (this.handleSpecialCharacterDeletion(deletedText)) {
      console.log("Handled Special Characters");
      return true;
    }

    const positionChange = currentEndCharacterPosition - currentStartCharacterPosition;
    return this.handleRegularDeletion(positionChange);
  }

  private handleMultiLineDeletion(deletedText: string): boolean {
    // Check if the deletion context is valid
    if (!this.isDeletionContextValid(deletedText)) {
      console.log("Location Not Verified for Deletion");
      this.suggestionManager.reinitialize();
      return false;
    }
    console.log("Location Verified for Deletion");

    if (this.suggestionManager.mainSuggestion.endsWith(deletedText + this.suggestionManager.tempSuggestion)) {
      console.log("Suggestion ends with deleted text + temp suggestion");
      this.suggestionManager.tempSuggestion = deletedText + this.suggestionManager.tempSuggestion;
      this.socketModule.completionProvider.updateSuggestion(this.suggestionManager.tempSuggestion);
      return true;
    } else {
      this.suggestionManager.reinitialize();
      return true;
    }
  }

  private isDeletionContextValid(deletedText: string): boolean {
    // Location verification Before and After Text Deletion
    const previousFullText = this.socketModule.previousText + this.suggestionManager.mainSuggestion;
    const tempSuggestionLength = this.suggestionManager.tempSuggestion.length;
    const deletedTextLength = deletedText.length;

    // Calculate the expected text before cursor
    const expectedTextBeforeCursor = previousFullText.slice(0, -tempSuggestionLength - deletedTextLength);
    const currentTextWithDeleted = this.suggestionManager.textBeforeCursor;

    console.log("Previous Full Text:", previousFullText);
    console.log("Expected Text Before Cursor:", expectedTextBeforeCursor);
    console.log("Current Text With Deleted:", currentTextWithDeleted);

    return expectedTextBeforeCursor === currentTextWithDeleted;
  }

  private handleSpecialCharacterDeletion(deletedText: string): boolean {
    if (deletedText.length === 2 && this.suggestionManager.deleteSpecialCharacters.includes(deletedText)) {
      // Recompute tempSuggestion based on current text
      const previousText = this.socketModule.previousText;
      const mainSuggestion = this.suggestionManager.mainSuggestion;

      // Current text before cursor
      const currentText = this.suggestionManager.textBeforeCursor;

      // Calculate the accepted part of mainSuggestion
      const acceptedSuggestion = currentText.substring(previousText.length);

      // Compute the new tempSuggestion
      this.suggestionManager.tempSuggestion = mainSuggestion.substring(acceptedSuggestion.length);

      // Update the suggestion in the editor
      this.socketModule.completionProvider.updateSuggestion(this.suggestionManager.tempSuggestion);
      console.log("Handled Special Character Deletion");
      console.log("**************************************")
      console.log("previousText", previousText)
      console.log("mainSuggestion", mainSuggestion)
      console.log("currentText", currentText)
      console.log("acceptedSuggestion", acceptedSuggestion)
      return true;
    }
    return false;
  }

  private handleRegularDeletion(positionChange: number): boolean {
    // Adjust the tempSuggestion based on the number of characters deleted
    this.suggestionManager.tempSuggestion = modifySuggestion(this.suggestionManager.mainSuggestion, this.suggestionManager.tempSuggestion, positionChange);
    
    // Update the suggestion in the editor
    this.socketModule.completionProvider.updateSuggestion(this.suggestionManager.tempSuggestion);

    if (this.suggestionManager.tempSuggestion) {
      return true; // Successfully updated the suggestion
    } else {
      // If tempSuggestion is empty or null, reinitialize
      this.suggestionManager.reinitialize();
      this.suggestionManager.predictionDelay = 2000;
      return false;
    }
  }

  public handleAllDeletion(
    currentStartLineNumber: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number,
    currentStartCharacterPosition: number
  ): void {
    this.suggestionManager.predictionDelay = 2000;
    if (currentStartLineNumber === currentEndLineNumber) {
      if (currentEndCharacterPosition - currentStartCharacterPosition > 2) {
        this.suggestionManager.predictionDelay = 5000;
        this.suggestionManager.typeOfAction = "NEO-SNE-D-LC-1";
      }
    } else {
      this.suggestionManager.predictionDelay = 10000;
      this.suggestionManager.typeOfAction = "NEO-SNE-D-LC-X";
    }
  }
}