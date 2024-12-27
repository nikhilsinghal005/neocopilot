import * as vscode from 'vscode';
import { SocketModule } from '../socketModule';
import { CodeInsertionManager } from '../codeInsertions/CodeInsertionManager';
import { v4 as uuidv4 } from 'uuid';
import { AiChatPanel } from '../chatProvider/aiChatPanel';
import { CodeSelectionCommand } from './selectionContext';
import { SelectionContext } from './selectionContext';
import { showTextNotification } from '../utilities/statusBarNotifications/showTextNotification';
import { showErrorNotification } from '../utilities/statusBarNotifications/showErrorNotification';
import { showCustomNotification } from '../utilities/statusBarNotifications/showCustomNotification';

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
                  this.attachSocketListeners();
                  await this.handleClick();
                  return; // Exit the loop on success
                } else {
                  retries++;
                  // showErrorNotification('Failed to get response. Retrying...', 0.9);
                  await delay(3000); // Wait 5 seconds before retrying
                }
              }
              if (retries >= 4) {
                showErrorNotification('Failed to get response. Please try again.', 2);
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
    // Get the start and end line numbers of the selection
    const startLine = selection.start.line;
    const endLine = selection.end.line;

    // Get the start position of the start line and the end position of the end line
    const start = editor.document.lineAt(startLine).range.start;
    const end = editor.document.lineAt(endLine).range.end;

    // Return a new selection that spans from the start of the start line to the end of the end line
    return new vscode.Selection(start, end);
  }

  private getLineSeparator(): string {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '\n'; // Default to LF if no editor is active
    }
    // Determine the end-of-line character used in the document
    const eol = editor.document.eol;
    return eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  }
  
  private attachSocketListeners(): void {
    // Check if there are no listeners for 'recieve_editor_code_refactor' event
    if (this.socketModule.socket?.listeners('recieve_editor_code_refactor').length === 0) {

      // Add a listener for 'recieve_editor_code_refactor' event
      this.socketModule.socket?.on('recieve_editor_code_refactor', (data: any) => {
        // Append the response to updatedtext
        this.updatedtext = this.updatedtext + data.response;

        // Check if the line is complete and there are no errors or rate limits
        if (data.isLineComplete && !data.isError && !data.isRateLimit) {
          console.log("Line complete");
          // Replace line endings and enqueue the snippet line by line
          const tempText: string = this.updatedtext.replace(/\r\n|\r/g, '\n').replace(/\n/g, this.nextLineCharacter);
          this.codeInsertionManager.enqueueSnippetLineByLine(
            tempText,
            data.id,
            this.nextLineCharacter,
            false
          );
          this.updatedtext = "";
        }

        // Check if the data is complete
        if (data.isComplete) {
          // this.socketModule.predictionRequestInProgress = false;
          if (data.isRateLimit) {
            console.log("Rate Limit Exceeded")
            console.log(data.rateLimitResponse);
            showCustomNotification(data.rateLimitResponse)
            this.updatedtext = "";
          } 
          else if (data.isError) {
              this.updatedtext = "";
              showErrorNotification(data.response, 0.9);
            }
          else {
            this.codeInsertionManager.enqueueSnippetLineByLine(
              "",
              data.id,
              this.nextLineCharacter,
              true
            );
            this.updatedtext = "";
          }
        }
      });
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

    // Split the selected text into lines and store the start and end line numbers
    this.codeInsertionManager.currentEditor = editor;
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

      this.sendEditorCodeRefactor(
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
  private async handleChatInsertCommand(selection: vscode.Selection) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    this.currentSelectionContext = selection;

    // Get selected text
    const selectedText = editor.document.getText(selection);
    this.completeText = editor.document.getText();
    this.currentFileName = editor.document.fileName;

    // Get the language of the document
    const documentLanguage = editor.document.languageId;

    await this.aiChatpanel.insertMessagesToChat(
        this.currentFileName,
        selectedText,
        this.completeText,
        documentLanguage // Pass the language to the function
    );
    console.log("File Name----------------", this.currentFileName)
    // Show message to user
    if (editor) {
      const position = editor.selection.start;
      editor.selection = new vscode.Selection(position, position);
    }
  }

  private sendEditorCodeRefactor(
    uniqueId: string, 
    uniqueChatId: string, 
    userInput: string, 
    selectedText: string,
    beforeText: string,
    afterText: string,
    completeText: string, 
    nextLineCharacter: string,
    actionType: string
  ) {
    console.log("Message to scoket from backend")
    // this.socketModule.predictionRequestInProgress = true;
    if (this.socketModule.socket) {
      this.socketModule.socket.emit('generate_editor_code_refactor', {
        uniqueId: uniqueId,
        chatId: uniqueChatId,
        userInput: userInput,
        selectedText: selectedText,
        beforeText: beforeText,
        afterText: afterText,
        completeText: completeText,
        nextLineCharacter: nextLineCharacter,
        actionType: actionType,
        appVersion: this.socketModule.currentVersion,
        userEmail: this.socketModule.email
      });
    }
  }

}


