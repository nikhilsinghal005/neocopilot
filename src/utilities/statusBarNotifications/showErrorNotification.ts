import * as vscode from 'vscode';

/**
 * Displays a custom error notification using the progress API.
 * The notification includes an error icon and dismisses itself after a specified duration.
 *
 * @param message - The error message to display.
 * @param timeInSeconds - The duration in seconds before the notification dismisses itself. Defaults to 5 seconds.
 */
export function showErrorNotification(message: string, timeInSeconds: number = 5): void {
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `❌ ${message}`, // Prefix with an error icon and label
      cancellable: true,
    },
    async () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve(); // Dismiss the notification after the specified duration
        }, timeInSeconds * 1000);
      });
    }
  );
}
