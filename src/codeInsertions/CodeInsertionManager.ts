// src/codeInsertions/CodeInsertionManager.ts
import * as vscode from 'vscode';
import { CodeInsertionCodeLensProvider } from './CodeInsertionCodeLensProvider';
import { insertTextAtCursorFunction } from './handleInsertionTypes/insertAtCursor';
import { insertSnippetAtCursorFunction} from './handleInsertionTypes/inserSnippetAtCursor';
import {insertTextIntoTerminalFunction} from './handleInsertionTypes/insertCommandTerminal';

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
  public oldLinesList: string[] = [];
  public oldStartLine: number = 0;
  public oldEndLine: number = 0;
  private insertedDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(92, 248, 1, 0.2)',
    isWholeLine: true
  });
  private deletedDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    isWholeLine: true
  });
  private sameDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 255, 0)',
  });

  public decorationsToApply = {
    deleted: [] as vscode.Range[],
    inserted: [] as vscode.Range[],
    same: [] as vscode.Range[]
  };

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

  public reinitialize(): void {
    // Dispose of all existing decorations
    this.insertions.forEach((insertion) => {
        insertion.decorationType.dispose();
        if (insertion.deletedDecorationType) {
            insertion.deletedDecorationType.dispose();
        }
        if (insertion.sameDecorationType) {
            insertion.sameDecorationType.dispose();
        }
    });

    // Clear decorations in the editor
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        editor.setDecorations(this.insertedDecorationType, []);
        editor.setDecorations(this.deletedDecorationType, []);
        editor.setDecorations(this.sameDecorationType, []);
    }

    // Reset insertion map
    this.insertions.clear();

    // Clear old lines list and reset old start and end line values
    this.oldLinesList = [];
    this.oldStartLine = 0;
    this.oldEndLine = 0;

    // Reinitialize the decoration types
    this.insertedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(92, 248, 1, 0.2)',
        isWholeLine: true,
    });
    this.deletedDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        isWholeLine: true,
    });
    this.sameDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 0, 255, 0)',
    });

    // Clear decorations to apply
    this.decorationsToApply = {
        deleted: [],
        inserted: [],
        same: [],
    };

    // Refresh CodeLens provider
    this.codeLensProvider.refresh();
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
        editor.setDecorations(this.insertedDecorationType, []);
        editor.setDecorations(this.deletedDecorationType, []);
        editor.setDecorations(this.sameDecorationType, []);
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
        editor.setDecorations(this.insertedDecorationType, []);
        editor.setDecorations(this.deletedDecorationType, []);
        editor.setDecorations(this.sameDecorationType, []);
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

  private countOccurrences(str: string, substring: string): number {
    // Split the string by the substring and get the length of the resulting array
    return str.split(substring).length - 1;
}

  /**
   * Inserts a snippet at the specified selection and highlights the deleted and inserted text.
   * @param updatedText The text to be inserted.
   * @param id Unique identifier for the insertion.
   * @param selectionContext The selection range in the editor.
   */
  public async insertSnippetLineByLine(
      updatedText: string,
      id: string,
      selectionContext: vscode.Selection | undefined,
      nextLineCharacter: string,
      isComplete: boolean = false
  ): Promise<void> {

      const editor = vscode.window.activeTextEditor;
      if (!editor || !selectionContext) {
          vscode.window.showErrorMessage('No active editor or valid selection context found.');
          return;
      }

      if (isComplete) {
        const insertion: Insertion = {
            id,
            range: selectionContext,
            decorationType: this.insertedDecorationType,
            deletedDecorationType: this.deletedDecorationType,
            sameDecorationType: this.sameDecorationType,
            codeLensRange: selectionContext,
            insertedRanges: this.decorationsToApply.inserted,
            deletedRanges: this.decorationsToApply.deleted,
            sameRanges: this.decorationsToApply.same,
        };

        this.insertions.set(id, insertion);
        this.codeLensProvider.refresh();
        return;
      }

      // count of occurances
      const countNextLineCharacter = this.countOccurrences(updatedText, nextLineCharacter);
      let newLineList = []
      if (countNextLineCharacter === 1) {
        newLineList = [updatedText.replace(/\r\n|\r/g, '')]
      } else {
        newLineList = updatedText.split(nextLineCharacter).slice(0, 2)
      }

      // console.log("final new Line", newLine)
      // Required Input Variables
      for (const newLine of newLineList) {
        const oldText = this.oldLinesList;
        const startLine = this.oldStartLine
        const endLine = this.oldEndLine
        let updatedIndex = 0
  
        // Index of newLine in oldText
        const index = oldText.indexOf(newLine); 

        if (index === -1) {
          // Getting Updated Positions
          const startPos = new vscode.Position(startLine + updatedIndex, 0);
          const endPos = new vscode.Position(startLine + updatedIndex, newLine.length - 1);
          const lineRange = new vscode.Range(startPos, endPos);
  
          // Inserting newLine into Editor
          const edit = new vscode.WorkspaceEdit();
          edit.insert(editor.document.uri, startPos, newLine + nextLineCharacter);
          await vscode.workspace.applyEdit(edit);
  
          // Applying Decorations
          this.decorationsToApply.inserted.push(lineRange);

          // Updating Finalize Variables
          updatedIndex += 1
          this.oldStartLine = startLine + updatedIndex
          this.oldEndLine = endLine + updatedIndex
        } else {
          const slicedLines = oldText.slice(0, index + 1)
  
          for (let tempLine in slicedLines) {
            const startPos = new vscode.Position(startLine + updatedIndex, 0);
            const endPos = new vscode.Position(startLine + updatedIndex, slicedLines.length - 1);
            const lineRange = new vscode.Range(startPos, endPos);
    
            if (slicedLines[tempLine] === newLine){
              this.decorationsToApply.same.push(lineRange);
            } else {
              this.decorationsToApply.deleted.push(lineRange);
            }  
  
            updatedIndex += 1
          }
          this.oldStartLine = startLine + updatedIndex
          this.oldEndLine = endLine + updatedIndex
          this.oldLinesList = oldText.slice(index + 1)
        }

        // Apply decorations
        editor.setDecorations(this.insertedDecorationType, this.decorationsToApply.inserted);
        editor.setDecorations(this.deletedDecorationType, this.decorationsToApply.deleted);
        editor.setDecorations(this.sameDecorationType, this.decorationsToApply.same);
      }
  } 
}