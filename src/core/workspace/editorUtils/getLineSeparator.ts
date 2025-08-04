import * as vscode from 'vscode';

export function getLineSeparator(): string {

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return '\n'; // Default to LF if no editor is active
    }
    const eol = editor.document.eol;
    return eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  }
