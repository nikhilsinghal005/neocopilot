// src/deletion/DeletionHandler.ts

import * as vscode from 'vscode';
import { SuggestionManager } from '../SuggestionManager';
import { modifySuggestion, handleAddedSpecialCharacters } from "../../utilities/codeCompletionUtils/completionUtils";
import { CompletionProviderModule } from '../../codeCompletion/completionProviderModule';
import { CompletionSocketManager } from '../../codeCompletion/completionSocketManager';

export class DeletionHandler {
  private suggestionManager: SuggestionManager;
  private completionProviderModule: CompletionProviderModule;
  private completionSocketManager: CompletionSocketManager;

  constructor(suggestionManager: SuggestionManager) {
    this.suggestionManager = suggestionManager;
    this.completionProviderModule = CompletionProviderModule.getInstance();
    this.completionSocketManager = CompletionSocketManager.getInstance();
  }

  /**
   * Handle deletion events based on the context of the deletion.
   * @param deletedText The text that was deleted.
   * @param currentStartLineNumber Starting line number of the deletion.
   * @param currentStartCharacterPosition Starting character position of the deletion.
   * @param currentEndLineNumber Ending line number of the deletion.
   * @param currentEndCharacterPosition Ending character position of the deletion.
   * @returns Whether the deletion was handled successfully.
   */
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
      return this.handleMultiLineDeletion(deletedText);
    }
  }

  /**
   * Handle deletions within the same line.
   */
  private handleSameLineDeletion(
    deletedText: string,
    currentStartCharacterPosition: number,
    currentEndCharacterPosition: number
  ): boolean {
    if (!this.isDeletionContextValid(deletedText)) {
      this.suggestionManager.reinitialize();
      return false;
    }

    if (this.handleSpecialCharacterDeletion(deletedText)) {
      return true;
    }

    const positionChange = currentEndCharacterPosition - currentStartCharacterPosition;
    return this.handleRegularDeletion(positionChange);
  }

  /**
   * Handle deletions across multiple lines.
   */
  private handleMultiLineDeletion(deletedText: string): boolean {
    if (!this.isDeletionContextValid(deletedText)) {
      this.suggestionManager.reinitialize();
      return false;
    }

    const { mainSuggestion, tempSuggestion } = this.suggestionManager;

    if (mainSuggestion.endsWith(deletedText + tempSuggestion)) {
      this.suggestionManager.tempSuggestion = deletedText + tempSuggestion;
      this.completionProviderModule.updateSuggestion(this.suggestionManager.tempSuggestion);
      return true;
    } else {
      this.suggestionManager.reinitialize();
      return false;
    }
  }

  /**
   * Validate the context of the deletion to ensure it's relevant.
   */
  private isDeletionContextValid(deletedText: string): boolean {
    const { mainSuggestion, tempSuggestion, textBeforeCursor } = this.suggestionManager;
    const previousFullText = this.completionSocketManager.previousText + mainSuggestion;
    const tempSuggestionLength = tempSuggestion.length;
    const deletedTextLength = deletedText.length;
    const expectedTextBeforeCursor = previousFullText.slice(0, -tempSuggestionLength - deletedTextLength);
    const currentTextWithDeleted = textBeforeCursor;

    return expectedTextBeforeCursor === currentTextWithDeleted;
  }

  /**
   * Handle deletions involving special characters.
   */
  private handleSpecialCharacterDeletion(deletedText: string): boolean {
    if (deletedText.length === 2 && this.suggestionManager.deleteSpecialCharacters.includes(deletedText)) {
      const { previousText } = this.completionSocketManager;
      const { mainSuggestion, textBeforeCursor } = this.suggestionManager;

      const acceptedSuggestion = textBeforeCursor.substring(previousText.length);
      this.suggestionManager.tempSuggestion = mainSuggestion.substring(acceptedSuggestion.length);

      this.completionProviderModule.updateSuggestion(
        this.suggestionManager.tempSuggestion
      );
      return true;
    }
    return false;
  }

  /**
   * Handle regular deletions by modifying the current suggestion.
   */
  private handleRegularDeletion(positionChange: number): boolean {
    const { mainSuggestion, tempSuggestion, textBeforeCursor } = this.suggestionManager;
    const modifiedSuggestion = modifySuggestion(mainSuggestion, tempSuggestion, positionChange);


    if (modifiedSuggestion) {
      this.suggestionManager.tempSuggestion = modifiedSuggestion;
      this.completionProviderModule.updateSuggestion(modifiedSuggestion);
      return true;
    } else {
      this.suggestionManager.reinitialize();
      this.suggestionManager.predictionDelay = 2000;
      return false;
    }
  }

  /**
   * Adjust prediction delay based on the type of deletion action.
   */
  public handleAllDeletion(
    currentStartLineNumber: number,
    currentEndLineNumber: number,
    currentEndCharacterPosition: number,
    currentStartCharacterPosition: number
  ): void {
    if (currentStartLineNumber === currentEndLineNumber) {
      const charDifference = currentEndCharacterPosition - currentStartCharacterPosition;
      if (charDifference > 2) {
        this.suggestionManager.predictionDelay = 5000;
        this.suggestionManager.typeOfAction = "NEO-SNE-D-LC-1";
      } else {
        this.suggestionManager.predictionDelay = 2000;
      }
    } else {
      this.suggestionManager.predictionDelay = 10000;
      this.suggestionManager.typeOfAction = "NEO-SNE-D-LC-X";
    }
  }
}
