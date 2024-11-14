// src/codeInsertions/CodeInsertionManager.ts
import * as vscode from 'vscode';
import { CodeInsertionCodeLensProvider } from './CodeInsertionCodeLensProvider';
import { insertTextAtCursorFunction } from './handleInsertionTypes/insertAtCursor';
import { insertSnippetAtCursorFunction} from './handleInsertionTypes/inserSnippetAtCursor';
import {insertTextIntoTerminalFunction} from './handleInsertionTypes/insertCommandTerminal';
import * as Diff from 'diff'; // Import jsdiff

/**
 * Represents an insertion in the editor.
 */
interface Insertion {
  id: string;
  range: vscode.Range;
  decorationType: vscode.TextEditorDecorationType;
  codeLensRange: vscode.Range;
  deletedDecorationType?: vscode.TextEditorDecorationType;
  sameDecorationType?: vscode.TextEditorDecorationType;
  insertedRanges: vscode.Range[];
  deletedRanges: vscode.Range[];
  sameRanges: vscode.Range[];
}

export class CodeInsertionManager {
  private static instance: CodeInsertionManager | null = null; // Singleton instance

  private disposables: vscode.Disposable[] = [];
  private insertions: Map<string, Insertion> = new Map();
  private codeLensProvider: CodeInsertionCodeLensProvider;
  private snippetText: string[] = [];
  private pendingEdits: { type: "insert"; position: vscode.Position; text: string }[] = [];

  constructor(context: vscode.ExtensionContext) {
    // Initialize CodeLens Provider
    this.codeLensProvider = new CodeInsertionCodeLensProvider(this);
    const providerDisposable = vscode.languages.registerCodeLensProvider(
      { scheme: 'file', language: '*' },
      this.codeLensProvider
    );
    this.disposables.push(providerDisposable);

    // Register Commands
    this.registerCommands(context);
  }

  // Static method to get the singleton instance
  public static getInstance(context: vscode.ExtensionContext): CodeInsertionManager {
    if (!CodeInsertionManager.instance) {
      CodeInsertionManager.instance = new CodeInsertionManager(context); // Create a new instance if it doesn't exist
    }
    return CodeInsertionManager.instance; // Return the existing instance
  }

  /**
   * Inserts text at the current cursor position with a unique ID.
   * @param newText The text to insert.
   * @param id Unique identifier for the insertion.
   */
  // public insertTextAtCursor(newText: string, id: string): void {
  //   const insertion = insertTextAtCursorFunction(newText, id);
  //   if (!insertion) {
  //     vscode.window.showErrorMessage('Failed to insert text.');
  //     return;
  //   }
  //   this.insertions.set(id, insertion);
  //   this.codeLensProvider.refresh();
  // }

  public getInsertionsForDocument(uri: vscode.Uri): Insertion[] {
    return Array.from(this.insertions.values()).filter(
      (insertion) => insertion.range.start.line >= 0
    );
  }

  /**
   * Accepts an insertion, keeping updated and same lines, and removing deleted lines.
   * @param id Unique identifier for the insertion.
   */
  public acceptInsertion(id: string): void {
    const insertion = this.insertions.get(id);
    if (!insertion) {
      vscode.window.showErrorMessage('Insertion not found.');
      return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  editor
    .edit((editBuilder) => {
      // Delete ranges for deleted lines
      insertion.deletedRanges.forEach((range) => {
        const fullLineRange = new vscode.Range(
          range.start.line,
          0,
          range.start.line + 1,
          0 // Move to the start of the next line to capture the newline
        ); 
        editBuilder.delete(fullLineRange);
      });
    })
    .then((success) => {
      if (success) {
        // Dispose of decorations
        insertion.decorationType.dispose();
        if (insertion.deletedDecorationType) {
          insertion.deletedDecorationType.dispose();
        }
        if (insertion.sameDecorationType) {
          insertion.sameDecorationType.dispose();
        }

        this.insertions.delete(id);
        this.codeLensProvider.refresh();
        vscode.window.showInformationMessage('Code accepted.');
      } else {
        vscode.window.showErrorMessage('Failed to accept the insertion.');
      }
    });
}

/**
 * Rejects an insertion, keeping only the same lines and removing updated and deleted lines.
 * @param id Unique identifier for the insertion.
 */
public rejectInsertion(id: string): void {
  const insertion = this.insertions.get(id);
  if (!insertion) {
    vscode.window.showErrorMessage('Insertion not found.');
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  editor
    .edit((editBuilder) => {
      // Delete ranges for inserted and deleted lines
      insertion.insertedRanges.forEach((range) => {
        const fullLineRange = new vscode.Range(
          range.start.line,
          0,
          range.start.line + 1,
          0 // Move to the start of the next line to capture the newline
        ); 
        editBuilder.delete(fullLineRange);
      });
    })
    .then((success) => {
      if (success) {
        // Dispose of all decorations
        if (insertion.decorationType) {
          insertion.decorationType.dispose();
        }
        if (insertion.deletedDecorationType) {
          insertion.deletedDecorationType.dispose();
        }
        if (insertion.sameDecorationType) {
          insertion.sameDecorationType.dispose();
        }

        this.insertions.delete(id);
        this.codeLensProvider.refresh();
        vscode.window.showInformationMessage('Code rejected.');
      } else {
        vscode.window.showErrorMessage('Failed to reject the insertion.');
      }
    });
}

  /**
   * Registers the "Accept" and "Reject" commands.
   * @param context The extension context.
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    const acceptCommand = vscode.commands.registerCommand('codeInsertion.accept', (id: string) => {
      this.acceptInsertion(id);
    });

    const rejectCommand = vscode.commands.registerCommand('codeInsertion.reject', (id: string) => {
      this.rejectInsertion(id);
    });

    this.disposables.push(acceptCommand, rejectCommand);
    context.subscriptions.push(...this.disposables);
  }

  /**
   * Disposes all decorations and commands.
   */
  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.insertions.forEach((insertion) => {
      insertion.decorationType.dispose();
      if (insertion.deletedDecorationType) {
        insertion.deletedDecorationType.dispose();
      }
    });
    this.insertions.clear();
  }

  public insertTextUsingSnippetAtCursorWithoutDecoration(newText: string, id: string): void {
    insertSnippetAtCursorFunction(newText, id, false);
  }
  
  public insertTextIntoTerminal(newText: string): void {
    insertTextIntoTerminalFunction(newText);
  }

  /**
   * Inserts a snippet at the specified selection and highlights the deleted and inserted text.
   * @param updatedText The text to be inserted.
   * @param id Unique identifier for the insertion.
   * @param selectionContext The selection range in the editor.
   */
  public insertSnippetOnSelection(updatedText: string, id: string, selectionContext: vscode.Selection | undefined): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !selectionContext) {
      vscode.window.showErrorMessage('No active editor or valid selection context found.');
      return;
    }
    
    console.log("Updated Text From Backend", updatedText)
    // Record the original text before making the changes
    const oldText = editor.document.getText(selectionContext);
  
    // Split old and new text into lines
    const oldLines = oldText.split(this.getLineSeparator());
    let updatedLines = updatedText.split('\n');
    
    console.log("Old Lines", oldLines)
    console.log("Updated Lines", updatedLines)

    // Create a decoration type
    const decorationsToApply = {
      deleted: [] as vscode.Range[],
      inserted: [] as vscode.Range[],
      same: [] as vscode.Range[]
    };
  
    let startLine = selectionContext.start.line;
    let updatedIndex = 0;

    for (let i = 0; i < oldLines.length; i++) {

      console.log("================== New Loop Begin ===========================")
      const oldLine = oldLines[i];

      // index of old line in updated lines
      const index = updatedLines.indexOf(oldLine);
      console.log("startLine", startLine)
      console.log("Index", index, oldLine)

      if (index > -1) {
          const slicedLines = updatedLines.slice(0, index + 1);
          updatedLines = updatedLines.slice(index + 1);
          console.log("Sliced Lines", slicedLines)

          // Mark the current line as the same
          for (let slicedLine of slicedLines) {
            const startPos = new vscode.Position(startLine + updatedIndex, 0);
            const endPos = new vscode.Position(startLine + updatedIndex, slicedLine.length);
            const lineRange = new vscode.Range(startPos, new vscode.Position(startLine + updatedIndex, 1000));
            if (oldLine !== slicedLine) {
              console.log("Went to Updated", slicedLine, startLine + updatedIndex)
              decorationsToApply.inserted.push(lineRange);
              this.pendingEdits.push({ type: "insert", position: startPos, text: slicedLine + this.getLineSeparator() });
              updatedIndex++;
            }else{
              console.log("Went to Same", slicedLine, startLine + updatedIndex)
              decorationsToApply.same.push(lineRange);
              updatedIndex++;
            }
          }
      } else{
        // Mark the old line as deleted
        const startPos = new vscode.Position(startLine + updatedIndex, 0);
        const endPos = new vscode.Position(startLine + updatedIndex, oldLine.length);
        const lineRange = new vscode.Range(startPos, new vscode.Position(startLine + updatedIndex, 1000));
        decorationsToApply.deleted.push(lineRange);
        updatedIndex++;
      }

    }
  
  // Handle any remaining updated lines as inserted
  for (const remainingLine of updatedLines) {
    console.log("Remaining Inserted Line", remainingLine, startLine + updatedIndex);
    const startPos = new vscode.Position(startLine + updatedIndex, 0);
    const endPos = new vscode.Position(startLine + updatedIndex, remainingLine.length);
    const lineRange = new vscode.Range(startPos, endPos);
    decorationsToApply.inserted.push(lineRange);

    // Add to pendingEdits array
    this.pendingEdits.push({ type: "insert", position: startPos, text: remainingLine + this.getLineSeparator() });
    updatedIndex++;
  }
    // Apply all pending edits in a single editor.edit call
    async function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    
    // Apply all pending edits in a single editor.edit call
    (async () => {
      for (const edit of this.pendingEdits) {
        if (edit.type === "insert") {
          console.log("Inserted Line:", edit.text, edit.position.line);
    
          // Apply the edit with a delay
          await editor.edit((editBuilder) => {
            editBuilder.insert(edit.position, edit.text);
          });
    
          // Add a delay between each edit
          await sleep(1000); // 500ms delay
        }
      }
    })();

    this.pendingEdits = [];

    // Apply decorations for inserted text (green), deleted text (red), and same text (blue)
    const insertedDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0, 255, 0, 0.244)', // Light green background for inserted text
    });
    editor.setDecorations(insertedDecorationType, decorationsToApply.inserted);
  
    const deletedDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(255, 0, 0, 0.288)', // Light red background for deleted text
    });
    editor.setDecorations(deletedDecorationType, decorationsToApply.deleted);
  
    const sameDecorationType = vscode.window.createTextEditorDecorationType({
      backgroundColor: 'rgba(0, 0, 255, 0)', // Light blue background for the same text
    });
    editor.setDecorations(sameDecorationType, decorationsToApply.same);
  
    // Save insertion details
    const insertion: Insertion = {
      id,
      range: selectionContext,
      decorationType: insertedDecorationType,
      deletedDecorationType: deletedDecorationType,
      sameDecorationType: sameDecorationType,
      codeLensRange: selectionContext,
      insertedRanges: decorationsToApply.inserted, // Store inserted ranges
      deletedRanges: decorationsToApply.deleted, // Store deleted ranges
      sameRanges: decorationsToApply.same, // Store same ranges
    };

    console.log("insertions", decorationsToApply.inserted)
    this.insertions.set(id, insertion);
    this.codeLensProvider.refresh();
    console.log("================== New Loop End ===========================")
    console.log("insertions", this.insertions)

  }

  /**
   * Retrieves the line separator based on the current editor settings.
   * This method will use the VS Code status bar or editor settings to determine if the
   * line separator is CRLF or LF.
   * @returns {string} The line separator used in the current editor ('\r\n' or '\n').
   */
  private getLineSeparator(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '\n'; // Default to LF if no editor is active
    }
  
    const eol = editor.document.eol;
    return eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  }
  
}