import * as vscode from 'vscode';

export function showTextNotification(message: string, timeInSeconds?: number) {
  // Show the message
  const displayMessage = vscode.window.showInformationMessage(message, { modal: false });

  // If a time is provided, set a timeout to automatically resolve the promise after the given time
  if (timeInSeconds) {
    setTimeout(() => {
      displayMessage.then(() => {}, () => {});  // Resolve or dismiss the message after the timeout
    }, timeInSeconds * 1000);  // Convert seconds to milliseconds
  }
}
