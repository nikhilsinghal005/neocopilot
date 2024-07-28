import * as vscode from 'vscode';

export function getTextAfterCursor(editor: vscode.TextEditor | undefined): string {
  // Function to get text after the cursor
  if (editor) {
    const position = editor.selection.active;
    const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount, 0));
    return editor.document.getText(range);
  }
  return "";
}

export function getTextBeforeCursor(editor: vscode.TextEditor | undefined): string {
  // Function to get text before the cursor
  if (editor) {
    const position = editor.selection.active;
    const range = new vscode.Range(new vscode.Position(0, 0), position);
    return editor.document.getText(range);
  }
  return "";
}


export function getCompleteEditorText(editor: vscode.TextEditor | undefined): string {
  // Function to get complete editor text
  if (editor) {
    return editor.document.getText();;
  }    
   return ''
}

export function getCursorPosition(editor: vscode.TextEditor | undefined): { line: number, character: number } | null {
  if (editor) {
    const position = editor.selection.active;
    return { line: position.line, character: position.character };
  }
  return null;
}