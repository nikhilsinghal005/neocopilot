import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';

export function getExactNewlineCharacter(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;

    if (!activeEditor) {
        return undefined; // No active editor
    }

    const eol = activeEditor.document.eol;
    return eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
}

export function generateChatId(): string {
    return uuidv4();
}