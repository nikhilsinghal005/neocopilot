import * as vscode from 'vscode';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';
import { AiChatPanel } from './chatProvider/aiChatPanel';
import { AuthManager } from './authManager/authManager';


export function initializeAppFunctions(
  vscodeEventsModule: VscodeEventsModule,
  completionProviderModule: CompletionProviderModule,
  authManager: AuthManager,
  context: vscode.ExtensionContext
): void {
  console.info("%cNeo Copilot: Initializing functinalities", 'color: green;')
  StatusBarManager.initializeStatusBar(true, context, vscodeEventsModule);
  vscode.window.onDidChangeActiveTextEditor(
    editor => vscodeEventsModule.getCurrentFileName(editor, context), null, context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => vscodeEventsModule.handleTextChange(event, context), null, context.subscriptions
  );

  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProviderModule,
  );

  vscode.workspace.getConfiguration().update('editor.quickSuggestions', false);
  const currentVersion = context.extension.packageJSON.version;

  const aiChatPanelProvider = AiChatPanel.getInstance(context.extensionUri, context, authManager);
  aiChatPanelProvider.sendAuthStatus(true);
}

export function initializeNonLoginRequiredAppFunctions(

  vscodeEventsModule: VscodeEventsModule,
  completionProviderModule: CompletionProviderModule,
  authManager: AuthManager,
  context: vscode.ExtensionContext
): void {
  console.info("%cNeo Copilot: Initializing functinalities", 'color: green;')
  const aiChatPanelProvider = AiChatPanel.getInstance(context.extensionUri, context, authManager);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AiChatPanel.viewType,
      aiChatPanelProvider
    )
  );
}
