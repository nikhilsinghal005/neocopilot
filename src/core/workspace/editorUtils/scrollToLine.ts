// src/utilities/editorUtils/scrollToLine.ts
import * as vscode from 'vscode';

/**
 * Scrolls to the specified line number in the active editor with a smooth animation.
 * @param lineNumber The line number to scroll to.
 */
export async function scrollToLine(lineNumber: number): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (editor) {
    const targetPosition = new vscode.Position(lineNumber - 1, 0);
    const currentPosition = editor.selection.active;

    const distance = targetPosition.line - currentPosition.line;
    const duration = 200; // Duration of the animation in milliseconds
    const steps = 20; // Number of steps in the animation
    const stepSize = distance / steps;
    const interval = duration / steps;

    for (let i = 1; i <= steps; i++) {
      const nextLine = currentPosition.line + stepSize * i;
      const nextPosition = new vscode.Position(Math.round(nextLine), 0);
      const nextRange = new vscode.Range(nextPosition, nextPosition);

      editor.selection = new vscode.Selection(nextPosition, nextPosition);
      editor.revealRange(nextRange, vscode.TextEditorRevealType.Default);

      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

