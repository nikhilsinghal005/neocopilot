// src/codeCompletion/vscodeEventsModule.ts

import * as vscode from 'vscode';
import { SocketModule } from '../../core/socket/socketModule';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleActiveEditor } from "../../core/workspace/codeCompletionUtils/editorUtils";
import { getCompleteEditorText } from "../../core/workspace/codeCompletionUtils/editorCodeUtils";
import { notSupportedFiles } from "../../core/workspace/codeCompletionUtils/completionUtils";
import { StatusBarManager } from '../../core/notifications/StatusBarManager';
import { SuggestionManager } from './SuggestionManager';
import { CompletionProviderModule } from './completionProviderModule';

/**
 * Handles various VSCode events related to code completion and suggestions.
 */
export class VscodeEventsModule {
  // Singleton instances of modules
  private socketModule: SocketModule;
  private suggestionManager: SuggestionManager;
  private completionProviderModule: CompletionProviderModule;

  // State variables
  private currentSelectedFileName: string | null = "";
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileNotSupported: boolean = false;
  public currentLanguage: string = "";
  public updatedText: string = "";
  public uniqueIdentifier: string = uuidv4();
  public previousText: string = "";
  public currentText: string = "";
  public isDisabled15Minutes: boolean = false;

  /**
   * Initializes the VscodeEventsModule with necessary modules.
   */
  constructor() {
    this.socketModule = SocketModule.getInstance();
    this.suggestionManager = new SuggestionManager(this);
    this.completionProviderModule = CompletionProviderModule.getInstance();
  }

  /**
   * Reinitializes the suggestion manager.
   */
  public reinitialize(): void {
    this.suggestionManager.reinitialize();
  }

  /**
   * Handles text changes in the active editor.
   * @param event Text document change event.
   * @param context Extension context.
   */
  public async handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext): Promise<void> {
    if (this.isDisabled15Minutes) {
      return;
    }

    if (this.isFileNotSupported) { // Checking if File is Supported or not
      this.reinitialize();
      this.currentText = "";
      return;
    }

    this.previousText = this.currentText;
    this.currentText = getCompleteEditorText(vscode.window.activeTextEditor);
    this.currentLanguage = event.document.languageId;

    // Getting event positions for the updated code.
    const contentChange = event.contentChanges[0];
    if (!contentChange || !contentChange.range) {
      return;
    }

    const { start, end } = contentChange.range;
    const currentStartLineNumber = start.line; // Line number of the text that is changed
    const currentStartCharacterPosition = start.character; // Character position of the text that is changed
    const currentEndLineNumber = end.line; // Line number of the text that is changed
    const currentEndCharacterPosition = end.character;

    // Delegate to SuggestionManager
    this.suggestionManager.handleTextChange(
      event,
      vscode.window.activeTextEditor,
      currentStartLineNumber,
      currentStartCharacterPosition,
      currentEndLineNumber,
      currentEndCharacterPosition,
    );
  }

  /**
   * Retrieves and handles the current file name from the active editor.
   * @param editor Active text editor.
   * @param context Extension context.
   */
  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext): void {
    try {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }

      this.debounceTimeout = setTimeout(() => {
        this.currentSelectedFileName = path.basename(handleActiveEditor(editor, context));

        if (notSupportedFiles(this.currentSelectedFileName)) {
          StatusBarManager.updateMessage(`$(error) Neo Copilot`);
          this.isFileNotSupported = true;
        } else {
          StatusBarManager.updateMessage(`$(check) Neo Copilot`);
          this.isFileNotSupported = false;
        }

        // Clear any existing suggestions when file support changes
        this.completionProviderModule.updateSuggestion("");
      }, 100);
    } catch (error) {
      this.socketModule.customInformationMessage('vscode_module:getCurrentFileName', JSON.stringify(error));
    }
  }

  /**
   * Disables code completion functionality for 15 minutes.
   */
  public disableFor15Minutes(): void {
    this.isDisabled15Minutes = true;
    StatusBarManager.updateMessage(`$(x) Neo Copilot`);
    this.reinitialize();
    this.socketModule.customInformationMessage("code-completion-disabled", "15min");
    console.info("%cNeo Copilot: Code completion disabled (15 minutes)", 'color: red;');

    setTimeout(() => {
      this.isDisabled15Minutes = false;
      StatusBarManager.updateMessage(`$(check) Neo Copilot`);
      this.socketModule.customInformationMessage("code-completion-enabled", "15min");
      console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Manually enables code completion functionality.
   */
  public enableCodeCompletion(): void {
    this.isDisabled15Minutes = false;
    this.socketModule.customInformationMessage("code-completion-enabled", "manually");
    this.reinitialize();
    StatusBarManager.updateMessage(`$(check) Neo Copilot`);
    console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
  }
}
