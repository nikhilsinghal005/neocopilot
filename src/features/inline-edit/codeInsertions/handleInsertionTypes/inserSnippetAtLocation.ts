import * as vscode from 'vscode';

interface Insertion {
    id: string;
    range: vscode.Range;
    decorationType: vscode.TextEditorDecorationType;
    codeLensRange: vscode.Range;
  }

/**
 * Inserts text at the current cursor position with a unique ID.
 * @param newText The text to insert.
 * @param id Unique identifier for the insertion.
 */
export function insertSnippetLocationFunction(
  newText: string,
  id: string,
  startPosition: { line: number; character: number }
): Insertion | undefined {
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

      return insertion;
    } else {
      vscode.window.showErrorMessage('Failed to insert snippet.');
    }
  });
}
