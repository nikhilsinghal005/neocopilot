// src/extension.ts

import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';
import { showLoginNotification } from './utilities/statusBarNotifications/showLoginNotification';
import { LOGIN_REDIRECT_URL } from './config';
import { Socket } from 'socket.io-client';
import { initializeAppFunctions, initializeNonLoginRequiredAppFunctions } from './initializeAppFunctions';
import { AuthManager } from './authManager/authManager';
import { handleTokenUri } from './authManager/handleTokenUri';

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  const completionProviderModule = new CompletionProviderModule();
  versionConfig.initialize(context);
  const authManager = new AuthManager(context);
  const socketModule = SocketModule.getInstance(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);
  const statusBarManager = new StatusBarManager();

  StatusBarManager.initializeStatusBar(false, context, vscodeEventsModule);  

  const isLoggedIn = await authManager.verifyAccessToken();
  initializeNonLoginRequiredAppFunctions(vscodeEventsModule, completionProviderModule, authManager, context);

  context.workspaceState.update('isLoggedIn', false);

  if (isLoggedIn) {
    const currentVersion = context.extension.packageJSON.version;
    const socketConnection: Socket | null = await socketModule.connect(currentVersion, context);
    
    if (socketConnection){
      initializeAppFunctions(vscodeEventsModule, completionProviderModule, authManager,  context);
    }else{
      showLoginNotification();
    }
  } else {
    showLoginNotification();
  }

  // Register the URI handler
  vscode.window.registerUriHandler({
    handleUri: (uri: vscode.Uri) => handleTokenUri(
      uri, 
      context, 
      vscodeEventsModule, 
      completionProviderModule,
      socketModule,
      authManager
    )
  });

  // Register the AI Chat Panel webview view provider

}

export function deactivate(): void {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  socketModule.disconnect();
}