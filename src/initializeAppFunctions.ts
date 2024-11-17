import * as vscode from 'vscode';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';
import { AiChatPanel } from './chatProvider/aiChatPanel';
import { AuthManager } from './authManager/authManager';
import { CodeSelectionCommandHandler } from './codeSelection/codeSelectionCommand';
import { FloatingHoverProvider } from './codeSelection/codeSelectionOverlayPanel'; // Adjust the path as necessary

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

  const primaryViewProvider = AiChatPanel.getInstance(context.extensionUri, context, authManager, AiChatPanel.primaryViewType);
  primaryViewProvider.sendAuthStatus(true)

  const documentSelector: vscode.DocumentSelector = { scheme: 'file', language: '*' };
  new  CodeSelectionCommandHandler(context);

 // Hover Provider 
 const hoverProvider = new FloatingHoverProvider();
 const hoverDisposable = vscode.languages.registerHoverProvider(
     { scheme: 'file', language: '*' }, // Adjust languages as needed
     hoverProvider
 );
 context.subscriptions.push(hoverDisposable);
}

export function initializeNonLoginRequiredAppFunctions(

  vscodeEventsModule: VscodeEventsModule,
  completionProviderModule: CompletionProviderModule,
  authManager: AuthManager,
  context: vscode.ExtensionContext
): void {
  // console.info("%cNeo Copilot: Initializing functionalities", 'color: green;');
  const primaryViewProvider = AiChatPanel.getInstance(context.extensionUri, context, authManager, AiChatPanel.primaryViewType);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AiChatPanel.primaryViewType,
      primaryViewProvider
    )
  );
}
