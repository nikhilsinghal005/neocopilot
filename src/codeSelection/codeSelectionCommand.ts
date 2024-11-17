import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';
import { v4 as uuidv4 } from 'uuid';

export enum CodeSelectionCommand {
  CODE_FACTOR = 'extension.neoEdit',
  ADD_COMMENT = 'extension.addComment',
}

export class CodeSelectionCommandHandler {
  private socketModule: SocketModule;
  private codeInsertionManager: CodeInsertionManager;
  private selectionContext: vscode.Selection | undefined;
  private completeText: string = "";
  private updatedtext: string = "";
  private nextLineCharacter: string = "";
  private uniqueRequestId: string = "";
  private uniqueChatId: string = "";

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
            () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor found.');
                    return;
                }

                const selection = editor.selection;
                if (selection.isEmpty) {
                    vscode.window.showErrorMessage('No text selected.');
                    return;
                }

                this.handleCodeFactorCommand(selection);
            }
        )
    );

    this.attachSocketListeners();
    this.socketModule.socket?.on('connect', () => {
        // Re-attach listeners on socket reconnect
        this.attachSocketListeners();
    });
}



  private getLineSeparator(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '\n'; // Default to LF if no editor is active
    }
  
    const eol = editor.document.eol;
    return eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  }
  
  private attachSocketListeners(): void {
    if (this.socketModule.socket?.listeners('recieve_editor_code_refactor').length === 0) {
      // ##### Add check for verify chat id's and response.
      this.socketModule.socket?.on('recieve_editor_code_refactor', (data: any) => {

        if (!data.isComplete) {
          this.updatedtext = this.updatedtext + data.response;
        } else {
          if (this.selectionContext){
          // Clear the selection in the active editor
            console.log("Code Factored.");
            console.log("Updated text: " + this.updatedtext);
            this.codeInsertionManager.insertSnippetOnSelection(
              this.updatedtext.replace(/\r\n|\r/g, '\n').replace(/\n/g, this.nextLineCharacter),
              data.id, 
              this.selectionContext
            );
            // const editor = vscode.window.activeTextEditor;
            // if (editor) {
            //   const position = editor.selection.start; // You can also use editor.selection.start
            //   editor.selection = new vscode.Selection(position, position);
            // }
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
      this.nextLineCharacter = this.getLineSeparator()
      this.uniqueRequestId = uuidv4();
      this.uniqueChatId = uuidv4();

      this.socketModule.sendEditorCodeRefactor(
        this.uniqueRequestId,
        this.uniqueChatId,
        userInput,
        selectedText, 
        this.completeText,
        this.nextLineCharacter
      );

      // Show message to user
            const editor = vscode.window.activeTextEditor;
            if (editor) {
              const position = editor.selection.start; // You can also use editor.selection.start
              editor.selection = new vscode.Selection(position, position);
            }
    } else {
      vscode.window.showInformationMessage('No input provided.');
    }
  }
}
