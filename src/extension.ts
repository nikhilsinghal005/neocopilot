// src/extension.ts

import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig';
import { showLoginNotification } from './utilities/statusBarNotifications/showLoginNotification';
import { Socket } from 'socket.io-client';
import { initializeAppFunctions, initializeNonLoginRequiredAppFunctions } from './initializeAppFunctions';
import { AuthManager } from './authManager/authManager';
import { handleTokenUri } from './authManager/handleTokenUri';

/**
 * Activates the VSCode extension.
 * 
 * @param context - The VSCode extension context, which provides access to the workspace state, subscriptions, and more.
 * @returns A promise that resolves when the activation process is complete.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {

  // Disable hover delay
  const config = vscode.workspace.getConfiguration('editor.hover');
  config.update('delay', 500, vscode.ConfigurationTarget.Global);

  // Disable minimap
  const configAll = vscode.workspace.getConfiguration('editor');
  const isMinimapEnabled = configAll.get<boolean>('minimap.enabled');
  configAll.update('minimap.enabled', !isMinimapEnabled, vscode.ConfigurationTarget.Global);

  // Initialize the modules
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

    initializeAppFunctions(
      vscodeEventsModule, 
      completionProviderModule, 
      authManager,  
      socketModule,
      context
    );

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

/**
 * Deactivates the VSCode extension.
 * 
 * This function is called when the extension is deactivated. It handles cleanup tasks such as disconnecting from services.
 */
export function deactivate(): void {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  socketModule.disconnect();
}

