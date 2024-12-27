import * as vscode from 'vscode';
import { CodeInsertionManager } from './CodeInsertionManager';

export class CodeInsertionCodeLensProvider implements vscode.CodeLensProvider {
  private codeInsertionManager: CodeInsertionManager;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  // Store the current editor reference
  public currentEditor: vscode.TextEditor | undefined;

  constructor(codeInsertionManager: CodeInsertionManager) {
    this.codeInsertionManager = codeInsertionManager;
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    // Ensure we are working with the correct editor and document
    if (this.currentEditor && document.uri.toString() !== this.currentEditor.document.uri.toString()) {
      return [];
    }

    const insertions = this.codeInsertionManager.getInsertionsForDocument(document.uri);
    const codeLenses: vscode.CodeLens[] = [];

    insertions.forEach((insertion) => {
      // Create "Accept" CodeLens with emoji
      const acceptCodeLens = new vscode.CodeLens(insertion.codeLensRange, {
        title: '✅ <<<<<<<<<<<<<<<< ACCEPT >>>>>>>>>>>>>>>>>>',
        command: 'codeInsertion.accept',
        arguments: [insertion.id],
      });

      // Create "Reject" CodeLens with emoji
      const rejectCodeLens = new vscode.CodeLens(insertion.codeLensRange, {
        title: '❌ <<<<<<<<<<<<<<<< REJECT >>>>>>>>>>>>>>>>>>',
        command: 'codeInsertion.reject',
        arguments: [insertion.id],
      });

      codeLenses.push(acceptCodeLens, rejectCodeLens);
    });

    return codeLenses;
  }

  /**
   * Triggers a refresh of CodeLenses for a specific editor.
   */
  public refresh(editor?: vscode.TextEditor): void {
    if (editor) {
      this.currentEditor = editor; // Ensure currentEditor is set
    }
    this._onDidChangeCodeLenses.fire();
  }
}
