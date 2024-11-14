import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';

export enum CodeSelectionCommand {
  CODE_FACTOR = 'extension.codeFactor',
  ADD_COMMENT = 'extension.addComment',
}

export class CodeSelectionCommandHandler {
  private socketModule: SocketModule;
  private codeInsertionManager: CodeInsertionManager;
  private selectionContext: vscode.Selection | undefined;
  private completeText: string = "";
  private updatedtext: string = "";
  private currentSelectionDetails: {
    selectedCode: string;
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  } | null = null; // Variable to store selection details

  constructor(private context: vscode.ExtensionContext) {
    this.socketModule = SocketModule.getInstance();
    this.codeInsertionManager = CodeInsertionManager.getInstance(context);
    this.registerCommands();
  }

  /**
   * Registers the commands in the context.
   */
  private registerCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        CodeSelectionCommand.CODE_FACTOR, 
        this.handleCodeFactorCommand.bind(this)
      ),
      // vscode.commands.registerCommand(
      //   CodeSelectionCommand.ADD_COMMENT, 
      //   this.handleAddCommentCommand.bind(this)
      // )
    );

    this.attachSocketListeners();
    this.socketModule.socket?.on('connect', () => {
      // console.log("Socket reconnected. Re-attaching listeners.");
      this.attachSocketListeners();
    });
  }

  private attachSocketListeners(): void {
    if (this.socketModule.socket?.listeners('recieve_editor_code_refactor').length === 0) {
      // console.log("Adding 'receive_chat_response' listener.");
      this.socketModule.socket?.on('recieve_editor_code_refactor', (data: any) => {
        // console.log("Received chat response: ", data.response);

        if (!data.isComplete) {
          this.updatedtext = this.updatedtext + data.response;
        } else {
          // console.log("Updated text: ", this.updatedtext);

          if (this.selectionContext){
            this.codeInsertionManager.insertSnippetOnSelection(
              this.updatedtext,
              data.id, 
              this.selectionContext
            );
            this.updatedtext = "";
            this.selectionContext = undefined;
            this.currentSelectionDetails = null;
          }
        }
      });
    } else {
      console.log("'recieve_editor_code_refactor' listener already exists.");
    }
  }

  /**
   * Handles the "Code Factor" command.
   */
  private async handleCodeFactorCommand(selection: vscode.Selection) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    this.selectionContext = selection;

    // Get selected text
    const selectedText = editor.document.getText(selection);
    this.completeText = editor.document.getText();

    // Store selection details
    this.currentSelectionDetails = {
      selectedCode: selectedText,
      startLine: selection.start.line,
      startCharacter: selection.start.character,
      endLine: selection.end.line,
      endCharacter: selection.end.character,
    };

    // Prompt user for input
    const userInput = await vscode.window.showInputBox({
      prompt: 'Enter the purpose or label for the selected code',
      placeHolder: 'e.g., Refactor, Review, Debug',
    });

    if (userInput) {
      // Send data through SocketModule
      this.socketModule.sendEditorCodeRefactor(userInput, selectedText, this.completeText);
      vscode.window.showInformationMessage(
        `You entered: "${userInput}" for the selected code: "${selectedText}"`
      );
    } else {
      vscode.window.showInformationMessage('No input provided.');
    }
  }



}
