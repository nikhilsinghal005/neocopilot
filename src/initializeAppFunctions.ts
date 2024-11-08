import * as vscode from 'vscode';
import { VscodeEventsModule } from './codeCompletion/vscodeEventsModule';
import { CompletionProviderModule } from './codeCompletion/completionProviderModule';
import { StatusBarManager } from './StatusBarManager';

export function initializeAppFunctions(
  vscodeEventsModule: VscodeEventsModule,
  completionProviderModule: CompletionProviderModule,
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
}
