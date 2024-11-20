// src/codeInsertions/CodeInsertionManager.ts
import * as vscode from 'vscode';
import { CodeInsertionCodeLensProvider } from './CodeInsertionCodeLensProvider';
import { insertTextAtCursorFunction } from './handleInsertionTypes/insertAtCursor';
import { insertSnippetAtCursorFunction} from './handleInsertionTypes/inserSnippetAtCursor';
import {insertTextIntoTerminalFunction} from './handleInsertionTypes/insertCommandTerminal';
import { createPatch } from 'diff';

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
  public async insertSnippetOnSelection(
      updatedText: string,
      id: string,
      selectionContext: vscode.Selection | undefined
  ): Promise<void> {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !selectionContext) {
          vscode.window.showErrorMessage('No active editor or valid selection context found.');
          return;
      }

      const oldText = editor.document.getText(selectionContext);
      const patch = createPatch('file', oldText, updatedText, '', '', {
        context: 100  // Number of context lines
      });
      let patchList: string[] = patch.split('\n');
      patchList = patchList.slice(5, patchList.length - 2)
      patchList = patchList.filter(line => !/^@@.*@@$/.test(line));
      const workspaceEdit = new vscode.WorkspaceEdit();
      const decorationsToApply = {
          deleted: [] as vscode.Range[],
          inserted: [] as vscode.Range[],
          same: [] as vscode.Range[]
      };
      let startLine = selectionContext.start.line;
      let updatedIndex = 0;
      this.pendingEdits = [];

      for (const line of patchList) {
        const startPos = new vscode.Position(startLine + updatedIndex, 0);
        const endPos = new vscode.Position(startLine + updatedIndex, line.length - 1);
        const lineRange = new vscode.Range(startPos, endPos);
      
        switch (true) {
          case line.startsWith("+"):
            const edit = new vscode.WorkspaceEdit();
            const textToInsert = line.slice(1); // Remove "+" from the line
            edit.insert(editor.document.uri, startPos, textToInsert);
            await vscode.workspace.applyEdit(edit);
            decorationsToApply.inserted.push(lineRange);
            break;
          case line.startsWith("-"):
            decorationsToApply.deleted.push(lineRange);
            break;
          default:
            decorationsToApply.same.push(lineRange);
            break;
        }
        updatedIndex++;
      }    

      // efine decoration types
      const insertedDecorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: 'rgba(92, 248, 1, 0.2)',
          isWholeLine: true
      });

      const deletedDecorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          isWholeLine: true
      });

      const sameDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 0, 255, 0)', // Light blue background for the same text
      });

      // Apply decorations
      editor.setDecorations(insertedDecorationType, decorationsToApply.inserted);
      editor.setDecorations(deletedDecorationType, decorationsToApply.deleted);
      editor.setDecorations(sameDecorationType, decorationsToApply.same);

      const insertion: Insertion = {
          id,
          range: selectionContext,
          decorationType: insertedDecorationType,
          deletedDecorationType: deletedDecorationType,
          sameDecorationType: sameDecorationType,
          codeLensRange: selectionContext,
          insertedRanges: decorationsToApply.inserted,
          deletedRanges: decorationsToApply.deleted,
          sameRanges: decorationsToApply.same,
      };

      this.insertions.set(id, insertion);
      this.codeLensProvider.refresh();
  } 
}