import * as vscode from 'vscode';
import { LOGIN_REDIRECT_URL } from '../../config';

export async function showLoginNotification( delayInSeconds: number = 10) {

  // Delay the execution using setTimeout with a Promise
  await new Promise(resolve => setTimeout(resolve, delayInSeconds * 1000));

  // Show login notification
  const result = await vscode.window.showInformationMessage(
    "Login to use NeoCopilot inline code completion",
    "LogIn"
  );

  // Open login URL if the user clicks "LogIn"
  if (result === "LogIn") {
    await vscode.env.openExternal(vscode.Uri.parse(LOGIN_REDIRECT_URL));
  }
}