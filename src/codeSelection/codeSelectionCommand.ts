import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';
import { v4 as uuidv4 } from 'uuid';
import { AiChatPanel } from '../chatProvider/aiChatPanel';
import { CodeSelectionCommand } from './selectionContext';
import { SelectionContext } from './selectionContext';
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';

export class CodeSelectionCommandHandler {
  private socketModule: SocketModule;
  private codeInsertionManager: CodeInsertionManager;
  private currentSelectionContext: vscode.Selection | undefined;
  private completeText: string = "";
  private updatedtext: string = "";
  private nextLineCharacter: string = "";
  private uniqueRequestId: string = "";
  private uniqueChatId: string = "";
  private aiChatpanel: AiChatPanel;
  private currentFileName: string = "";
  private selectionContext: SelectionContext;
  

  private currentSelectionDetails: {
    selectedCode: string;
    startLine: number;
    startCharacter: number;
    endLine: number;
    endCharacter: number;
  } | null = null; // Variable to store selection details

  constructor(private context: vscode.ExtensionContext, aiChatpanel: AiChatPanel, selectionContext: SelectionContext) {
    this.socketModule = SocketModule.getInstance();
    this.codeInsertionManager = CodeInsertionManager.getInstance(context);
    this.selectionContext = selectionContext;
    this.aiChatpanel = aiChatpanel;
    this.registerCommands();
  }


  private expandSelectionToLine() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No active editor
    }

    const selection = editor.selection;
    const document = editor.document;

    // Get the start and end positions of the selection
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    // Create new range that covers from the start of the line to the end of the line
    const newSelection = new vscode.Selection(
        document.lineAt(startLine).range.start, // Start of the first line
        document.lineAt(endLine).range.end     // End of the last line
    );

    // Apply the new selection
    editor.selection = newSelection;
  }

  private async handleClick() {
    const editor = vscode.window.activeTextEditor;
    this.codeInsertionManager.currentEditor = editor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    let selection = editor.selection;
    const isEmpty = selection.isEmpty;

    if (isEmpty) {
        // check if anything exists in the current line after trimming.
        const currentLine = editor.document.lineAt(selection.start.line).text.trim();
        console.log("currentLine", currentLine);
        if (currentLine.length > 0) {
          // show error message
          vscode.window.showErrorMessage('Please select any text to use this command.');
          return;
        }
        // this.handleCodeFactorCommandForNoSelection(selection);
    }else{
        this.expandSelectionToLine();
        selection = editor.selection;
        this.codeInsertionManager.selectionContext = selection;
        const selectedText = editor.document.getText(selection).trim();
        this.selectionContext.clearHoverCache();
        this.selectionContext.clearHover(editor);
        vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
        editor.setDecorations(this.selectionContext.decorationType, []);
        await this.handleCodeFactorCommand(selection);
    }
  }

  /**
   * Registers the commands in the context.
   */
  private registerCommands() {
    this.context.subscriptions.push(
        vscode.commands.registerCommand(
            CodeSelectionCommand.CODE_FACTOR,
            async () => {
              const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
              let retries = 0;
              while (retries < 4) {
                console.log("retries", retries);
                if (this.socketModule.socket?.connected) {
                  await this.handleClick();
                  return; // Exit the loop on success
                } else {
                  this.attachSocketListeners();
                  retries++;
                  showTextNotification('Trying to connect with system. Please wait', 2);
                  await delay(5000); // Wait 5 seconds before retrying
                }
              }
              if (retries >= 4) {
                showTextNotification('Unable to connect with system. Please check internet connection', 2);
              }
            }
        ),
        vscode.commands.registerCommand(
          CodeSelectionCommand.CHAT_INSERT,
          async () => {
              const editor = vscode.window.activeTextEditor;
              if (!editor) {
                  vscode.window.showErrorMessage('No active editor found.');
                  return;
              }
              editor.setDecorations(this.selectionContext.decorationType, []);
              const selection = editor.selection;
              if (selection.isEmpty) {
                  vscode.window.showErrorMessage('No text selected.');
                  return;
              }

              this.selectionContext.clearHoverCache();
              this.selectionContext.clearHover(editor);
              await this.handleChatInsertCommand(selection);
              vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
          }
      )
    );

    this.attachSocketListeners();
    this.socketModule.socket?.on('connect', () => {
        // Re-attach listeners on socket reconnect
        this.attachSocketListeners();
    });
  }

  private expandSelectionToFullLines(selection: vscode.Selection, editor: vscode.TextEditor): vscode.Selection {
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    const start = editor.document.lineAt(startLine).range.start;
    const end = editor.document.lineAt(endLine).range.end;

    return new vscode.Selection(start, end);
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
        this.updatedtext = this.updatedtext + data.response;

        if (data.isLineComplete) {
          console.log("Line complete");
          const tempText: string = this.updatedtext.replace(/\r\n|\r/g, '\n').replace(/\n/g, this.nextLineCharacter);
          this.codeInsertionManager.enqueueSnippetLineByLine(
            tempText,
            data.id,
            this.nextLineCharacter,
            false
          );
          this.updatedtext = "";
        }

        if (data.isComplete) {
          console.log("complete");
          this.codeInsertionManager.enqueueSnippetLineByLine(
            "",
            data.id,
            this.nextLineCharacter,
            true
          );
          this.updatedtext = "";
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
    console.log("With Selection");
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }
    this.codeInsertionManager.reinitialize();
    this.currentSelectionContext = selection;
    this.nextLineCharacter = this.getLineSeparator();

    // Get selected text
    const selectedText = editor.document.getText(selection);
    this.completeText = editor.document.getText();

    this.codeInsertionManager.oldLinesList = selectedText.split(this.nextLineCharacter);
    this.codeInsertionManager.oldStartLine = selection.start.line;
    this.codeInsertionManager.oldEndLine = selection.end.line;
    this.codeInsertionManager.decorationsToApply = {
      deleted: [] as vscode.Range[],
      inserted: [] as vscode.Range[],
      same: [] as vscode.Range[]
    };

    // Prompt user for input
    const userInput = await vscode.window.showInputBox({
      prompt: 'Enter the purpose or action for the selected code',
      placeHolder: 'e.g., Refactor Code, Add comments',
    });

    if (userInput) {
      // Send data through SocketModule
      this.uniqueRequestId = uuidv4();
      this.uniqueChatId = uuidv4();

      this.socketModule.sendEditorCodeRefactor(
        this.uniqueRequestId,
        this.uniqueChatId,
        userInput,
        selectedText, 
        "",
        "",
        this.completeText,
        this.nextLineCharacter,
        "select_action"
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

/**
 * Handles the "Code Factor" command.
 */
private async handleCodeFactorCommandForNoSelection(selection: vscode.Selection) {
  console.log("Without Selection");

  const editor = this.codeInsertionManager.currentEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

    this.codeInsertionManager.reinitialize();
    this.currentSelectionContext = selection;
    this.nextLineCharacter = this.getLineSeparator();

    // Get selected text
    const selectedText = editor.document.getText(selection);
    const position = editor.selection.active; // Get the current cursor position
    const currentLineText = editor.document.lineAt(position.line).text; // Get the line where the cursor is currently positioned

  // Check if the current line is empty after trimming
  if (currentLineText.trim() === '') {
    const documentText = editor.document.getText();
    const textBeforeLine = documentText.substring(0, editor.document.offsetAt(new vscode.Position(position.line, 0)));
    const textAfterLine = documentText.substring(editor.document.offsetAt(new vscode.Position(position.line + 1, 0)));

    this.currentSelectionContext = selection;

    // Prompt user for input
    const userInput = await vscode.window.showInputBox({
      prompt: 'Enter the purpose or label for the text',
      placeHolder: 'e.g., Refactor, Review, Debug',
    });

    if (userInput) {
      // Send data through SocketModule
      this.nextLineCharacter = this.getLineSeparator();
      this.uniqueRequestId = uuidv4();
      this.uniqueChatId = uuidv4();

      this.socketModule.sendEditorCodeRefactor(
        this.uniqueRequestId,
        this.uniqueChatId,
        userInput,
        "def",
        textBeforeLine, // Text before the line
        textAfterLine,  // Text after the line
        textBeforeLine + this.nextLineCharacter + textAfterLine,
        this.nextLineCharacter,
        "no_select_action"
      );
    } else {
      vscode.window.showInformationMessage('No input provided.');
    }
  } else {
    // If the current line is not empty
    vscode.window.showInformationMessage(
      'The current line is not empty. Select some text or move to an empty line to use the edit functionality.'
    );
  }
  }
  
  /**
   * Handles the "Code Factor" command.
   */
  private async handleChatInsertCommand(selection: vscode.Selection) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    this.currentSelectionContext = selection;
    // console.log("Code worked")
    // Get selected text
    const selectedText = editor.document.getText(selection);
    this.completeText = editor.document.getText();
    this.currentFileName = editor.document.fileName;

    await this.aiChatpanel.insertMessagesToChat(
      this.currentFileName,
      selectedText,
      this.completeText
    );

    // Send data through SocketModule
    // Show message to user
    if (editor) {
      const position = editor.selection.start; // You can also use editor.selection.start
      editor.selection = new vscode.Selection(position, position);
    }
  }
}


