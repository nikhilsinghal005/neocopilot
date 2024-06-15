import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { AiChatPanel } from './providers/AiChatPanel';
import { storeTokens } from './utilities/secretStore';
import { verifyAccessToken } from './utilities/accessTokenVerification';
import { getIsLoggedIn, setIsLoggedIn } from "./utilities/logInStatus";
import { showLoginNotification } from "./utilities/showLoginNotification";
import { io, Socket } from 'socket.io-client';
import { StatusBarManager } from './StatusBarManager';

let decorationType: vscode.TextEditorDecorationType;

export async function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);
  const isLoggedIn = true;
  StatusBarManager.initializeStatusBar();
  StatusBarManager.updateMessage('Neo');

  // Define the decoration type with the plus symbol icon
  decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      contentIconPath: vscode.Uri.file(context.asAbsolutePath('resources/plus-icon.png')),
      width: '20px',
      height: '20px',
    }
  });

  context.subscriptions.push(decorationType);

  // Listen for cursor movements to update the decoration
  vscode.window.onDidChangeTextEditorSelection(event => {
    updateDecorations(event.textEditor, event.selections[0].active.line);
  }, null, context.subscriptions);

  // Register the command for the plus symbol click event
  const disposable = vscode.commands.registerCommand('extension.plusSymbolClicked', () => {
    vscode.window.showInformationMessage('Plus symbol clicked!');
  });

  context.subscriptions.push(disposable);

  // Additional existing code
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

  if (isLoggedIn) {
    const socketConnection: Socket = socketModule.connect();
  }
}

export function deactivate() {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  socketModule.disconnect();
}

function updateDecorations(editor: vscode.TextEditor, line: number) {
  const decorationOptions: vscode.DecorationOptions[] = [];
  const range = new vscode.Range(line, 0, line, 0);
  const decoration: vscode.DecorationOptions = { range };
  decorationOptions.push(decoration);
  editor.setDecorations(decorationType, decorationOptions);
}
