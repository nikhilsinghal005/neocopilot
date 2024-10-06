import * as vscode from 'vscode';
import { CodeInsertionCodeLensProvider } from './CodeInsertionCodeLensProvider';

interface Insertion {
  id: string;
  range: vscode.Range;
  decorationType: vscode.TextEditorDecorationType;
  codeLensRange: vscode.Range;
}

export class CodeInsertionManager {
  private disposables: vscode.Disposable[] = [];
  private insertions: Map<string, Insertion> = new Map();
  private codeLensProvider: CodeInsertionCodeLensProvider;

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

  /**
   * Inserts text at the current cursor position with a unique ID.
   * @param newText The text to insert.
   * @param id Unique identifier for the insertion.
   */
  public insertTextAtCursor(newText: string, id: string): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const position = editor.selection.active;

    editor
      .edit((editBuilder) => {
        editBuilder.insert(position, newText);
      })
      .then((success) => {
        if (success) {
          const lines = newText.split('\n').length - 1;
          const lastLineLength = newText.split('\n').pop()?.length || 0;
          const endPosition = position.translate(lines, lastLineLength);
          const range = new vscode.Range(position, endPosition);

          const decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(45, 225, 75, 0.5)', // Green highlight
          });

          editor.setDecorations(decorationType, [range]);

          const codeLensPosition = new vscode.Position(range.start.line, 0);
          const codeLensRange = new vscode.Range(codeLensPosition, codeLensPosition);

          const insertion: Insertion = {
            id,
            range,
            decorationType,
            codeLensRange,
          };

          this.insertions.set(id, insertion);

          this.codeLensProvider.refresh();
        }
      });
  }

  /**
   * Retrieves all insertions for a given document.
   * @param uri The URI of the document.
   * @returns Array of Insertion objects.
   */
  public getInsertionsForDocument(uri: vscode.Uri): Insertion[] {
    return Array.from(this.insertions.values()).filter(
      (insertion) => insertion.range.start.line >= 0
    );
  }

  /**
   * Accepts an insertion, removing its decoration and CodeLens.
   * @param id Unique identifier for the insertion.
   */
  public acceptInsertion(id: string): void {
    const insertion = this.insertions.get(id);
    if (!insertion) {
      vscode.window.showErrorMessage('Insertion not found.');
      return;
    }

    insertion.decorationType.dispose();
    this.insertions.delete(id);
    this.codeLensProvider.refresh();

    vscode.window.showInformationMessage('Code accepted.');
  }

  /**
   * Rejects an insertion, removing its decoration and deleting the inserted text.
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
        editBuilder.delete(insertion.range);
      })
      .then((success) => {
        if (success) {
          insertion.decorationType.dispose();
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
    this.insertions.forEach((insertion) => insertion.decorationType.dispose());
    this.insertions.clear();
  }

  public insertTextLineByLine(newText: string, id: string): void {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }
    
      const position = editor.selection.active;
    
      editor
        .edit((editBuilder) => {
          editBuilder.insert(position, newText);
          // editor.insertSnippet(newText, position);
        })
        .then((success) => {
          if (success) {
            const lines = newText.split('\n').length;
            const lastLineLength = newText.split('\n').pop()?.length || 0;
            const endPosition = new vscode.Position(
              position.line + lines - 1,
              lastLineLength
            );
            const range = new vscode.Range(position, endPosition);
    
            // Apply decoration over the full range of inserted text
            const decorationType = vscode.window.createTextEditorDecorationType({
              backgroundColor: 'rgba(51, 149, 67, 0.5)', // Green highlight
            });
    
            editor.setDecorations(decorationType, [range]);
    
            const codeLensPosition = new vscode.Position(range.start.line, 0);
            const codeLensRange = new vscode.Range(codeLensPosition, codeLensPosition);
    
            const insertion: Insertion = {
              id,
              range,
              decorationType,
              codeLensRange,
            };
    
            this.insertions.set(id, insertion);
    
            // Trigger formatting after insertion
            // this.formatInsertedCode(editor, range);
            this.codeLensProvider.refresh();
          } else {
            vscode.window.showErrorMessage('Failed to insert text.');
          }
        });
    }
    
    public insertTextUsingSnippet(newText: string, id: string): void {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }
    
      const position = editor.selection.active;
    
      const snippetText = newText.replace(/\$/g, '\\$'); // Escape $ symbols in snippet
      const snippet = new vscode.SnippetString(snippetText);
    
      editor
        .insertSnippet(snippet, position)
        .then((success) => {
          if (success) {
            const lines = newText.split('\n').length;
            const lastLineLength = newText.split('\n').pop()?.length || 0;
            const endPosition = new vscode.Position(
              position.line + lines - 1,
              lastLineLength
            );
            const range = new vscode.Range(position, endPosition);
    
            // Apply decoration over the full range of inserted text
            const decorationType = vscode.window.createTextEditorDecorationType({
              backgroundColor: 'rgba(38, 236, 71, 0.281)', // Green highlight
            });
    
            editor.setDecorations(decorationType, [range]);
    
            const codeLensPosition = new vscode.Position(range.start.line, 0);
            const codeLensRange = new vscode.Range(codeLensPosition, codeLensPosition);
    
            const insertion: Insertion = {
              id,
              range,
              decorationType,
              codeLensRange,
            };
    
            this.insertions.set(id, insertion);
            this.codeLensProvider.refresh();
          } else {
            vscode.window.showErrorMessage('Failed to insert snippet.');
          }
        });
    }

    public insertTextUsingSnippetLocation(
      newText: string,
      id: string,
      startPosition: { line: number; character: number }
    ): void {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }
    
      // Convert the provided startPosition into a vscode.Position object
      const position = new vscode.Position(startPosition.line, startPosition.character);
    
      const snippetText = newText.replace(/\$/g, '\\$'); // Escape $ symbols in snippet
      const snippet = new vscode.SnippetString(snippetText);
    
      editor.insertSnippet(snippet, position).then((success) => {
        if (success) {
          const lines = newText.split('\n').length;
          const lastLineLength = newText.split('\n').pop()?.length || 0;
          const endPosition = new vscode.Position(position.line + lines - 1, lastLineLength);
          const range = new vscode.Range(position, endPosition);
    
          // Create a line decoration to highlight the entire lines where text was inserted
          const lineDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true, // Highlight the entire line
            backgroundColor: 'rgba(38, 236, 71, 0.15)', // Light green background to highlight lines
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(38, 236, 71, 0.5)', // Optional: Add border to make it stand out
          });
    
          // Apply the line decorations
          editor.setDecorations(lineDecorationType, [range]);
    
          const codeLensPosition = new vscode.Position(range.start.line, 0);
          const codeLensRange = new vscode.Range(codeLensPosition, codeLensPosition);
    
          const insertion: Insertion = {
            id,
            range,
            decorationType: lineDecorationType,
            codeLensRange,
          };
    
          this.insertions.set(id, insertion);
          this.codeLensProvider.refresh();
        } else {
          vscode.window.showErrorMessage('Failed to insert snippet.');
        }
      });
    }
    
    
    private formatInsertedCode(editor: vscode.TextEditor, range: vscode.Range): void {
      // Format the inserted text to adjust its layout and indentation
      editor.selection = new vscode.Selection(range.start, range.end);
      vscode.commands.executeCommand('editor.action.formatSelection').then(
        () => {
          // Adjust indentation specifically to match typing behavior
          vscode.commands.executeCommand('editor.action.reindentlines').then(
            () => {
              vscode.window.showInformationMessage('Inserted code formatted and indented correctly.');
            },
            (err) => {
              console.error('Error adjusting indentation:', err);
            }
          );
        },
        (err) => {
          console.error('Error formatting inserted code:', err);
        }
      );
    }
}
