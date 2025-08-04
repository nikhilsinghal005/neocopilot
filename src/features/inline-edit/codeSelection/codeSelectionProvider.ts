// src/codeDelection/codeSelectionProvider.ts
import * as vscode from 'vscode';
import { CodeSelectionCommand } from './selectionContext';

export class CodeSelectionProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  private selectionTimeout: NodeJS.Timeout | null = null;
  private lastSelection: vscode.Selection | null = null;
  private isSelectionStable: boolean = false;

  constructor() {
    // Listen to selection changes and document changes
    vscode.window.onDidChangeTextEditorSelection(
      this.handleSelectionChange,
      this,
      []
    );
    vscode.workspace.onDidChangeTextDocument(
      this.handleDocumentChange,
      this,
      []
    );
  }

  /**
   * Resets the selection stability and sets up a timeout to check for stability.
   */
  private resetSelectionStability() {
    // Clear any existing timeout
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }

    // Set selection stable to false
    this.isSelectionStable = false;

    // Set a timeout to check if the selection remains constant
    this.selectionTimeout = setTimeout(() => {
      this.isSelectionStable = true; // Set selection stable to true
      this.refresh(); // Trigger a refresh since the selection has stabilized
    }, 500); // Wait 1 second for the selection to stabilize
  }

  /**
   * Handles text editor selection changes.
   * If the selection remains constant for 1 second, trigger a refresh.
   */
  private handleSelectionChange = (event: vscode.TextEditorSelectionChangeEvent) => {
    const editor = event.textEditor;
    const selection = editor.selection;

    // Update last selection
    this.lastSelection = selection;

    // Reset selection stability
    this.resetSelectionStability();
  };

  /**
   * Handles text document changes.
   * If the selection is active, debounce the refresh to update CodeLens accordingly.
   */
  private handleDocumentChange = (_event: vscode.TextDocumentChangeEvent) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.selection;

    // If the selection is not empty, reset the stability
    if (!selection.isEmpty) {
      // Reset selection stability
      this.resetSelectionStability();
    }
  };

  /**
   * Triggers a refresh of CodeLenses.
   */
  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Compares two selections for equality.
   * Returns true if they are the same, false otherwise.
   */
  private isSelectionEqual(
    a: vscode.Selection | null,
    b: vscode.Selection
  ): boolean {
    if (!a) {
      return false;
    }
    return (
      a.start.line === b.start.line &&
      a.start.character === b.start.character &&
      a.end.line === b.end.line &&
      a.end.character === b.end.character
    );
  }

  /**
   * Provides CodeLenses based on the current selection.
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];

    if (!this.isSelectionStable) {
      return codeLenses; // Selection not stable yet
    }

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return codeLenses;
    }

    const selection = editor.selection;

    if (selection.isEmpty) {
      // No selection, no CodeLens to display
      return codeLenses;
    }

    // Ensure selection covers at least two lines
    const startLine = selection.start.line;
    const endLine = selection.end.line;
    if (endLine - startLine < 1) {
      return codeLenses; // Less than two lines selected
    }

    // Check if the selected text is empty or only whitespace
    const selectedText = document.getText(selection).trim();
    if (selectedText === '') {
      return codeLenses; // Do not show CodeLens for empty or whitespace selection
    }

    const lensRange = new vscode.Range(startLine, 0, startLine, 0);

    // Create "Code Factor" CodeLens
    const codeFactorLens = new vscode.CodeLens(lensRange, {
      title: 'Neo: Code Factor',
      command: CodeSelectionCommand.codeFactor,
      arguments: [selection]
    });
    codeLenses.push(codeFactorLens);

    // // Create "Add Comment" CodeLens
    // const addCommentLens = new vscode.CodeLens(lensRange, {
    //   title: 'Add Comment',
    //   command: CodeSelectionCommand.ADD_COMMENT,
    //   arguments: [selection]
    // });
    // codeLenses.push(addCommentLens);
    return codeLenses;
  }

  /**
   * Resolves CodeLenses.
   * Since commands are already set in provideCodeLenses, no additional resolution is needed.
   */
  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }
}
