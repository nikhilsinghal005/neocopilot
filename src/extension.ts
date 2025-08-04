// src/extension.ts

import * as vscode from 'vscode';
import { AuthManager } from './core/auth/authManager';
import { AiChatPanel } from './features/chat/aiChatPanel';

/**
 * Activates the VSCode extension.
 * Focus: Only activate and expose the AI Chat Panel. All other features are not used.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {

  // Initialize AuthManager (can be expanded for chat auth if ever needed)
  const authManager = new AuthManager(context);

  // Register and show only the AI Chat Panel (singleton webview view provider)
  const primaryViewProvider = AiChatPanel.getInstance(
    context.extensionUri,
    context,
    authManager,
    AiChatPanel.primaryViewType
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AiChatPanel.primaryViewType,
      primaryViewProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );
}

/**
 * Deactivates the VSCode extension.
 */
export function deactivate(): void {
  // No teardown required for chat-only mode.
}
