import * as vscode from 'vscode';
import { showTextNotification } from '../../utilities/statusBarNotifications/showTextNotification';
import { showErrorNotification } from '../../utilities/statusBarNotifications/showErrorNotification';

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
    decorationRequired: boolean = true
  ): Insertion | undefined {
    const editor = vscode.window.activeTextEditor;
    
    // Check if there is an active editor
    if (!editor) {
      showErrorNotification('No active editor found.', 3)
      return;
    }
  
    // Get the current position of the cursor in the editor
    const position = editor.selection.active;
  
    // Prepare the snippet by escaping $ symbols (needed for VSCode Snippets)
    const snippetText = newText.replace(/\$/g, '\\$'); // Escape $ symbols in snippet
    const snippet = new vscode.SnippetString(snippetText);
  
    // Insert the snippet at the current cursor position
    editor.insertSnippet(snippet, position).then((success) => {
      // if (success && decorationRequired) {
      //   // Calculate the range of the inserted snippet
      //   const lines = newText.split('\n').length;
      //   const lastLineLength = newText.split('\n').pop()?.length || 0;
      //   const endPosition = new vscode.Position(position.line + lines - 1, lastLineLength);
      //   const range = new vscode.Range(position, endPosition);
  
      //   // Create a decoration to highlight the inserted code
      //   const lineDecorationType = vscode.window.createTextEditorDecorationType({
      //     isWholeLine: true, // Highlight the entire line
      //     backgroundColor: 'rgba(38, 236, 71, 0.15)', // Light green background to highlight lines
      //     borderWidth: '1px',
      //     borderStyle: 'solid',
      //     borderColor: 'rgba(38, 236, 71, 0.5)', // Optional: Add border to make it stand out
      //   });
  
      //   // Apply the line decorations
      //   editor.setDecorations(lineDecorationType, [range]);
  
      //   // Create a range for CodeLens (optional, depending on your need)
      //   const codeLensPosition = new vscode.Position(range.start.line, 0);
      //   const codeLensRange = new vscode.Range(codeLensPosition, codeLensPosition);
  
      //   // Store insertion information for future reference
      //   const insertion: Insertion = {
      //     id,
      //     range,
      //     decorationType: lineDecorationType,
      //     codeLensRange,
      //   };
  
      //   return insertion;
      // } else {
      //   vscode.window.showErrorMessage('Failed to insert snippet.');
      // }
    });
  }