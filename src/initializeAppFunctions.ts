import * as vscode from 'vscode';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';
import { AiChatPanel } from './chatProvider/aiChatPanel';
import { AuthManager } from './authManager/authManager';
import { CodeSelectionProvider } from './codeSelection/codeSelectionProvider';
import { CodeSelectionCommandHandler } from './codeSelection/codeSelectionCommand';


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

  const codeLensProvider = new CodeSelectionProvider();
  const documentSelector: vscode.DocumentSelector = { scheme: 'file', language: '*' };
  vscode.languages.registerCodeLensProvider(documentSelector, codeLensProvider);
  new  CodeSelectionCommandHandler(context);

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
  // const secondaryViewProvider = AiChatPanel.getInstance(context.extensionUri, context, authManager, AiChatPanel.secondaryViewType);
  // context.subscriptions.push(
  //   vscode.window.registerWebviewViewProvider(
  //     AiChatPanel.secondaryViewType,
  //     secondaryViewProvider
  //   )
  // );
}
