import * as vscode from 'vscode';
import { showErrorNotification } from '../../../../core/notifications/statusBarNotifications/showErrorNotification';

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
export function insertSnippetAtCursorFunction(
    newText: string,
    id: string,
    _decorationRequired: boolean = true
  ): Insertion | undefined {
    const editor = vscode.window.activeTextEditor;
    
    // Check if there is an active editor
    if (!editor) {
      showErrorNotification('No active editor found.', 3);
      return;
    }
  
    // Get the current position of the cursor in the editor
    const position = editor.selection.active;
  
    // Prepare the snippet by escaping $ symbols (needed for VSCode Snippets)
    const snippetText = newText.replace(/\$/g, '\\$'); // Escape $ symbols in snippet
    const snippet = new vscode.SnippetString(snippetText);
  
    // Insert the snippet at the current cursor position
    editor.insertSnippet(snippet, position).then((_success) => {
    });
  }