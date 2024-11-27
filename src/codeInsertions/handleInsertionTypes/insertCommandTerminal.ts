import * as vscode from 'vscode';
import { showTextNotification } from '../../utilities/statusBarNotifications/showTextNotification';

/**
 * Inserts text at the current cursor position with a unique ID.
 * @param newText The text to insert.
 * @param id Unique identifier for the insertion.
 */
export function  insertTextIntoTerminalFunction(newText: string): void {
    // Check if there is an active terminal
    let terminal = vscode.window.activeTerminal;
    if (!terminal) {
      // If no terminal is active, create a new terminal
      terminal = vscode.window.createTerminal('Code Snippet Terminal');
      showTextNotification('No active terminal found. Created a new terminal..', 2)
    }
  
    // Escape special characters in the newText (like $ symbols) if necessary
    const terminalText = newText.replace(/\$/g, '\\$'); // Escape $ symbols if needed for terminal
  
    // Send the newText to the terminal
    terminal.show(); // Ensure the terminal is visible
    terminal.sendText(terminalText, true); // Send text and execute it
  }
  