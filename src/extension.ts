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
  const completionProviderModule = CompletionProviderModule.getInstance();
  versionConfig.initialize(context);
  const authManager = new AuthManager(context);
  const socketModule = SocketModule.getInstance();
  const vscodeEventsModule = new VscodeEventsModule();
  const statusBarManager = new StatusBarManager();

  StatusBarManager.initializeStatusBar(false, context, vscodeEventsModule);  

  const isLoggedIn = await authManager.verifyAccessToken();
  await initializeNonLoginRequiredAppFunctions(authManager, context);

  if (isLoggedIn) {
    const currentVersion = context.extension.packageJSON.version;
    const socketConnection: Socket | null = await socketModule.connect(currentVersion, context);

    await initializeAppFunctions(
      vscodeEventsModule, 
      completionProviderModule, 
      authManager,  
      socketModule,
      context
    );

  } else {
    context.workspaceState.update('isLoggedIn', false);
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
  const completionProviderModule = CompletionProviderModule.getInstance();
  const socketModule = new SocketModule();
  socketModule.disconnect();
}

