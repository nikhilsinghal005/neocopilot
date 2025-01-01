import * as vscode from 'vscode';
import { LOGIN_REDIRECT_URL } from '../../config';

export async function showCustomNotification(customMessage: string, displayDurationInSeconds: number = 10) {
  // console.log("Custom Message:", customMessage);

  // Define the buttons as MessageItem objects
  const upgradeButton: vscode.MessageItem = { title: "Upgrade to Pro" };
  const continueButton: vscode.MessageItem = { title: "Continue", isCloseAffordance: false };
  
  const showButtons = customMessage.includes("Neo:");
  // console.log("Show Buttons:", showButtons);

  const displayMessage = customMessage.replace(/^Neo:\s*/, '');

  const notificationPromise = vscode.window.showInformationMessage(
    displayMessage,
    ...(showButtons ? [upgradeButton, continueButton] : [])
  );

  setTimeout(() => {
    notificationPromise.then(() => {
      // No direct method to close the notification, but this ensures the promise is resolved
    });
  }, displayDurationInSeconds * 1000);

  const result = await notificationPromise;
  if (result?.title === "Upgrade to Pro") {
    await vscode.env.openExternal(vscode.Uri.parse(LOGIN_REDIRECT_URL));
  }
}