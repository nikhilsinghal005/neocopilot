import * as vscode from 'vscode';
import {getIsLoggedIn, setIsLoggedIn} from "../utilities/logInStatus";

export async function showLoginNotification(url: string, context: vscode.ExtensionContext) {
    const isLogged: Boolean = await getIsLoggedIn(context);
    if (!isLogged){
      const result = await vscode.window.showInformationMessage(
        "Login to use CodeBuddy chat and inline code completion",
        "LogIn"
      );
      if (result === "LogIn") {
        await vscode.env.openExternal(vscode.Uri.parse(url));
      }
    }
  }