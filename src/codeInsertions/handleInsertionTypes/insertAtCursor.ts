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
export function insertTextAtCursorFunction(newText: string, id: string):  Insertion | undefined {
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
        
        return insertion

    }
    });
}