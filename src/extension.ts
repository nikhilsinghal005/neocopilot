import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { AiChatPanel } from './aiChatPanel';

export function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);

  vscode.window.onDidChangeActiveTextEditor(
    editor => vscodeEventsModule.handleActiveEditor(editor, context), null, context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => vscodeEventsModule.handleTextChange(event, context), null, context.subscriptions
  );

  // Register the inline completion item provider
  vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, completionProviderModule);
  vscode.workspace.getConfiguration().update('editor.quickSuggestions', false);

  const aiChatPanelProvider = new AiChatPanel(context.extensionUri);
  let view = vscode.window.registerWebviewViewProvider(
      'aiChatPanel',
      aiChatPanelProvider
  );
  context.subscriptions.push(view);

}


// vscode.languages.registerInlineCompletionItemProvider(
//   { pattern: '**' },
//   {
//     provideInlineCompletionItems: async (document, position) => {
//       return [{ text: '< 2) {\n\treturn 1;\n\t}' }]
//     },
//   },
// )
