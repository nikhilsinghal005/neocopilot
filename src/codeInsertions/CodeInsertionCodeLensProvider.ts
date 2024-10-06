import * as vscode from 'vscode';
import { CodeInsertionManager } from './CodeInsertionManager';

export class CodeInsertionCodeLensProvider implements vscode.CodeLensProvider {
  private codeInsertionManager: CodeInsertionManager;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(codeInsertionManager: CodeInsertionManager) {
    this.codeInsertionManager = codeInsertionManager;
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const insertions = this.codeInsertionManager.getInsertionsForDocument(document.uri);
    const codeLenses: vscode.CodeLens[] = [];

    insertions.forEach((insertion) => {
      // Create "Accept" CodeLens
      const acceptCodeLens = new vscode.CodeLens(insertion.codeLensRange, {
        title: 'Accept',
        command: 'codeInsertion.accept',
        arguments: [insertion.id],
      });

      // Create "Reject" CodeLens
      const rejectCodeLens = new vscode.CodeLens(insertion.codeLensRange, {
        title: 'Reject',
        command: 'codeInsertion.reject',
        arguments: [insertion.id],
      });

      codeLenses.push(acceptCodeLens, rejectCodeLens);
    });

    return codeLenses;
  }

  /**
   * Triggers a refresh of CodeLenses.
   */
  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}
