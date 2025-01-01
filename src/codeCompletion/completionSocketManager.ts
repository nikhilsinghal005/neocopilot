// src/codeCompletion/completionSocketManager.ts

import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { CompletionProviderModule } from '../codeCompletion/completionProviderModule';
import { StatusBarManager } from '../StatusBarManager';
import { versionConfig } from '../versionConfig';
import {
  handleAddedSpecialCharacters,
  findFirstMatch,
  searchSuggestion,
} from "../utilities/codeCompletionUtils/completionUtils";
import { getTextBeforeCursor } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { GetLineSeparator } from '../utilities/editorUtils/getLineSeparator';
import { showCustomNotification } from '../utilities/statusBarNotifications/showCustomNotification';

/**
 * Interface representing the structure of a prediction received from the socket.
 */
interface PredictionReceived {
  message: string;
  unique_Id: string;
  message_list: string[];
}

export class CompletionSocketManager {
  // Singleton instance
  private static instance: CompletionSocketManager;

  // Public properties
  public socketListSuggestion: string[] = [];
  public suggestion: string = "";
  public predictionRequestInProgress = false;
  public predictionWaitText = "";
  public tempUniqueIdentifier: string = "NA";
  public currentVersion = versionConfig.getCurrentVersion();
  public currentSuggestionId: string = "";
  public isSuggestionRequired: boolean = true;
  public startTime: number = performance.now();
  public previousText: string = "";
  private rateLimitTime: number = 0;
  private isRateLimitExceeded: boolean = false;
  private rateLimitDebounceTimeout: any = null; // Store timeout for debounce logic

  
  // Private properties
  private tempSuggestion: string = "";
  private debounceTimer: NodeJS.Timeout | null = null;
  private deleteSpecialCharacters = ['()', '{}', '[]', '""', "''"];
  private completionProviderModule: CompletionProviderModule;
  private socketModule: SocketModule;

  // Private constructor for Singleton pattern
  private constructor() {
    this.completionProviderModule = CompletionProviderModule.getInstance();
    this.socketModule = SocketModule.getInstance();
    this.attachSocketListeners();
  }

  // Get Singleton instance
  public static getInstance(): CompletionSocketManager {
    if (!CompletionSocketManager.instance) {
      CompletionSocketManager.instance = new CompletionSocketManager();
    }
    return CompletionSocketManager.instance;
  }

  /**
   * Reinitialize socket state.
   */
  public reinitializeSocket(): void {
    this.predictionRequestInProgress = false;
    this.isSuggestionRequired = true;
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.completionProviderModule.updateSuggestion("");
  }

  /**
   * Attach necessary socket listeners.
   */
  public attachSocketListeners(): void {
    if (this.socketModule.socket?.listeners('receive_message').length === 0) {
      this.socketModule.socket.on('receive_message', (data: any) => {
        try {
          this.predictionRequestInProgress = false;
          StatusBarManager.updateMessage(`$(check) Neo Copilot`);
          const timeDiff = (performance.now() - this.startTime).toFixed(2);
          console.info(
            `%cNeo Copilot: Prediction completion time: ${timeDiff} milliseconds`,
            'color: green;'
          );

          if (this.isSuggestionRequired) {
            this.predictionHandleFunction(data);
          } else {
            this.completionProviderModule.updateSuggestion("");
            this.triggerInlineSuggestion();
            this.isSuggestionRequired = true;
          }
        } catch (error) {
          this.socketModule.customInformationMessage(
            'socket_module:receive_message', 
            JSON.stringify(error)
          );
        }
      });
    }
  }

  /**
   * Emit a message to the socket.
   * @param uuid Unique identifier for the request.
   * @param prefix Text before the cursor.
   * @param suffix Text after the cursor.
   * @param inputType Type of input.
   * @param language Programming language.
   */
  public emitMessage(
    uuid: string,
    prefix: string,
    suffix: string,
    inputType: string,
    language: string
  ): void {
    if (this.isRateLimitExceeded) {
      console.warn("Rate limit exceeded. Prediction request aborted.");
      return;
    }

    this.predictionRequestInProgress = true;
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.completionProviderModule.updateSuggestion("");
    StatusBarManager.updateMessage(`$(loading~spin) Neo Copilot`);
    this.tempUniqueIdentifier = uuid;

    if (this.socketModule.socket) {
      const timestamp = new Date().toISOString();
      this.socketModule.socket.emit('send_message', {
        prefix,
        suffix,
        inputType,
        uuid,
        appVersion: this.socketModule.currentVersion,
        language,
        timestamp,
        userEmail: this.socketModule.email,
      });
    }

    this.previousText = prefix;
  }

  /**
   * Trigger inline suggestion in the editor.
   */
  private triggerInlineSuggestion(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      vscode.commands.executeCommand('editor.action.inlineSuggest.hide');
      vscode.commands.executeCommand('editor.action.inlineSuggest.trigger');
    }
  }

  /**
   * Send a chat completion message.
   * @param completion_type Type of completion.
   * @param completion_comment Comment for the completion.
   * @param completion_size Size of the completion.
   */
  public chatCompletionMessage(
    completion_type: string,
    completion_comment: string,
    completion_size: number
  ): void {
    if (this.isRateLimitExceeded) {
      return;
    }

    if (this.socketModule.socket) {
      this.socketModule.socket.emit('completion_accepted', {
        uuid: this.currentSuggestionId,
        completion_type,
        completion_comment,
        completion_size,
        userEmail: this.socketModule.email,
      });
    }
  }

  /**
   * Handle prediction data received from the socket.
   * @param predictionReceived Data received from the socket.
   */
  private predictionHandleFunction(predictionReceived: any): void {
    // Check for rate limti hit
    if (predictionReceived.isRateLimit){
        showCustomNotification(predictionReceived.rateLimitResponse);
        this.rateLimitTime = predictionReceived.rateLimitTime
        this.isRateLimitExceeded = predictionReceived.isRateLimit
        this.reinitializeSocket()

        // Log a warning with the remaining rate limit time
        console.warn(`Code completion rate limit hit. Limited for ${this.rateLimitTime} seconds.`);

        // Cap the timeout to a maximum value (e.g., 1 day)
        const maxTimeout = 24 * 60 * 60; // 1 day in seconds
        const timeout = Math.min(this.rateLimitTime, maxTimeout);

        // Set a timer for when the rate limit expires
        setTimeout(() => {
          this.isRateLimitExceeded = false;
          this.rateLimitTime = 0;
        }, timeout * 1000);

        return;
    }

    const prediction: PredictionReceived = {
      message: predictionReceived.message,
      message_list: predictionReceived.message_list,
      unique_Id: predictionReceived.unique_Id
    };

    // Check if the prediction Exisits
    if (!prediction.message) {
      console.warn('No prediction received.');
      return;
    }

    // Validate the prediction data
    if (this.tempUniqueIdentifier !== prediction.unique_Id) {
      console.warn('Received prediction does not match the current request.');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.warn('No active editor found.');
      return;
    }

    const currentTextBeforeCursor = getTextBeforeCursor(editor);
    const expectedText = `${this.previousText}${this.predictionWaitText}`;

    if (currentTextBeforeCursor !== expectedText) {
      //console.log("Cursor position changed; suggestion not applied");
      return;
    }

    // Update suggestion details
    this.currentSuggestionId = prediction.unique_Id;
    this.suggestion = this.extractSuggestion(prediction.message);
    this.socketListSuggestion = prediction.message_list;
    // //console.log("Received suggestion",  JSON.stringify(this.socketListSuggestion));
    //console.log("Received suggestion--", this.suggestion);
    // //console.log("Received suggestion", this.currentSuggestionId);
    
    //console.log("-------------------------", this.predictionWaitText)
    // Handle prediction wait text
    if (this.predictionWaitText) {
      this.handlePredictionWaitText();
    } else {
      //console.log("Updating suggestion with new prediction");
      this.completionProviderModule.updateSuggestion(this.suggestion);
    }

    this.triggerInlineSuggestion();
  }

  /**
   * Extract the suggestion from the prediction message.
   * @param message The prediction message received.
   * @returns The extracted suggestion.
   */
  private extractSuggestion(message: string): string {
    const suggestionLines = message.split(GetLineSeparator());
    if (suggestionLines[0].trim() === "" && suggestionLines.length > 1) {
      return suggestionLines[0] + GetLineSeparator() + suggestionLines[1];
    }
    return suggestionLines[0];
  }

  /**
   * Handle the prediction wait text logic.
   */
  private handlePredictionWaitText(): void {
    if (this.suggestion.startsWith(this.predictionWaitText)) {
      this.updateSuggestionAfterWaitText();
    } else if (findFirstMatch(this.socketListSuggestion, this.suggestion, this.predictionWaitText)) {
      this.updateSuggestionWithMatch();
    } else if (this.isSpecialCharacter(this.predictionWaitText)) {
      this.handleSpecialCharacters();
    } else {
      this.clearSuggestions();
    }
  }

  /**
   * Update suggestion by removing the prediction wait text.
   */
  private updateSuggestionAfterWaitText(): void {
    const updatedSuggestion = this.suggestion.substring(this.predictionWaitText.length);
    this.completionProviderModule.updateSuggestion(updatedSuggestion);
    this.chatCompletionMessage(
      "partial_completion",
      'prediction_wait_feature',
      this.predictionWaitText.length
    );
    this.predictionWaitText = "";
  }

  /**
   * Update suggestion when a match is found.
   */
  private updateSuggestionWithMatch(): void {
    const [newSuggestion, tempSuggestion] = searchSuggestion(
      this.socketListSuggestion,
      this.previousText,
      getTextBeforeCursor(vscode.window.activeTextEditor),
      this.predictionWaitText
    );
    this.suggestion = newSuggestion;
    this.tempSuggestion = tempSuggestion;
    this.completionProviderModule.updateSuggestion(this.tempSuggestion);
    this.chatCompletionMessage(
      "partial_completion",
      'prediction_wait_feature',
      this.predictionWaitText.length
    );
    this.predictionWaitText = "";
  }

  /**
   * Handle the case where predictionWaitText is a special character.
   */
  private handleSpecialCharacters(): void {
    const updatedSuggestion = handleAddedSpecialCharacters(
      this.suggestion,
      this.suggestion,
      this.predictionWaitText
    );
    this.completionProviderModule.updateSuggestion(updatedSuggestion);
  }

  /**
   * Clear suggestions if no conditions are met.
   */
  private clearSuggestions(): void {
    this.suggestion = "";
    this.socketListSuggestion = [];
    this.completionProviderModule.updateSuggestion(this.suggestion);
  }

  /**
   * Check if the given text is a special character that should be deleted.
   * @param text The text to check.
   * @returns True if it is a special character, false otherwise.
   */
  private isSpecialCharacter(text: string): boolean {
    return this.deleteSpecialCharacters.includes(text);
  }
}
