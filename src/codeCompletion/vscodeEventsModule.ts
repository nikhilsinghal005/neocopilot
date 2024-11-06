// src/vscodeEventsModule.ts
import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { handleActiveEditor } from "../utilities/codeCompletionUtils/editorUtils";
import { getCompleteEditorText } from "../utilities/codeCompletionUtils/editorCodeUtils";
import { isNullOrEmptyOrWhitespace, notSupportedFiles } from "../utilities/codeCompletionUtils/completionUtils";
import { getDeletedText } from "../utilities/codeCompletionUtils/completionUtils";
import { StatusBarManager } from '../StatusBarManager';
import { SuggestionManager } from '../codeCompletion/SuggestionManager';

export class VscodeEventsModule {

  private socketModule: SocketModule;
  private suggestionManager: SuggestionManager;
  private currentSelectedFileName: string | null = "";
  private debounceTimeout: NodeJS.Timeout | undefined;
  private isFileNotSupported: boolean = false
  private currentLanguage: string = "";
  private currentStartLineNumber: number = -1;
  private currentStartCharacterPosition: number = -1;
  private currentEndLineNumber: number = -1;
  private currentEndCharacterPosition: number = -1;
  private updatedText: string = "";
  public uniqueIdentifier: string = uuidv4();
  private previousText: string = "";
  private currentText: string = "";

  public isDisabled15Minutes: boolean = false;

  constructor(socketModule: SocketModule) {
    this.socketModule = socketModule;
    this.suggestionManager = new SuggestionManager(socketModule);
  }

  public reinitialize(comment: string = ""): void {
    // if (comment){console.log(comment);}
    this.suggestionManager.reinitialize();
  }

  public eventPositionVariables(event: vscode.TextDocumentChangeEvent): Boolean {
    try {
      const range = event.contentChanges[0].range;
      this.currentStartLineNumber = range.start.line; // Line number of the text that is changed
      this.currentStartCharacterPosition = range.start.character; // Character position of the text that is changed
      this.updatedText = event.contentChanges[0].text; // Text that is changed
      this.currentEndLineNumber = range.end.line; // Line number of the text that is changed
      this.currentEndCharacterPosition = range.end.character; // Character position of the text that is changed
      return true;
    }catch(error){
      console.log(JSON.stringify(event.contentChanges[0]))
      return false;
    }
  }

  public async handleTextChange(event: vscode.TextDocumentChangeEvent, context: vscode.ExtensionContext) {
    if (!this.isDisabled15Minutes) {
      if (this.socketModule.socket?.connected) {

        if (this.isFileNotSupported){ // Cheking if File is Supported or not
          this.reinitialize();
          this.currentText = ""
          return null;
        } else {

          this.previousText = this.currentText;
          this.eventPositionVariables(event);
          this.currentText = getCompleteEditorText(vscode.window.activeTextEditor);
          console.log("Current Text", this.currentText)
          console.log("previousText Text", this.previousText)

          this.currentLanguage = event.document.languageId;
  
          // Delegate to SuggestionManager
          this.suggestionManager.handleTextChange(
            event,
            vscode.window.activeTextEditor,
            this.currentText,
            this.previousText,
            this.currentStartLineNumber,
            this.currentStartCharacterPosition,
            this.currentEndLineNumber,
            this.currentEndCharacterPosition,
            this.updatedText,
            this.currentLanguage
          );
        }
      } else {
        this.reinitialize();
        this.socketModule.rateLimitExceeded = false;
        const currentVersion = context.extension.packageJSON.version;
        await this.socketModule.connect(currentVersion, context);
      }
    }
  }

  public getCurrentFileName(editor: vscode.TextEditor | undefined, context: vscode.ExtensionContext) {
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
        // console.log(`File Not Supported: ${this.isFileNotSupported}`);
        this.socketModule.completionProvider.updateSuggestion("");
      }, 100);
    } catch (error) {
      this.socketModule.customInformationMessage('vscode_module:getCurrentFileName', JSON.stringify(error));
      // console.log(error);
    }
  }

  public disableFor15Minutes(): void {
    this.isDisabled15Minutes = true;
    StatusBarManager.updateMessage(`$(x) Neo Copilot`);
    this.reinitialize();
    this.socketModule.customInformationMessage("code-completion-disabled", "15min");
    console.info("%cNeo Copilot: Code completion disabled(15min)", 'color: red;');
    setTimeout(() => {
      this.isDisabled15Minutes = false;
      StatusBarManager.updateMessage(`$(check) Neo Copilot`);
      this.socketModule.customInformationMessage("code-completion-enabled", "15min");
      console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
    }, 15 * 60 * 1000);
  }

  public enableCodeCompletion(): void {
    this.isDisabled15Minutes = false;
    this.socketModule.customInformationMessage("code-completion-enabled", "manually");
    this.reinitialize();
    StatusBarManager.updateMessage(`$(check) Neo Copilot`);
    console.info("%cNeo Copilot: Code completion enabled", 'color: green;');
  }
}
