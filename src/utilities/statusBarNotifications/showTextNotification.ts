import * as vscode from 'vscode';

export function showTextNotification(message: string, timeInSeconds?: number) {
  if (!timeInSeconds) {
    timeInSeconds = 5; // Default to 5 seconds if no time is specified
  }

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: message,
      cancellable: false,
    },
    async (progress) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve(); // Resolve the promise after the specified duration
        }, timeInSeconds * 1000);
      });
    }
  );
}
