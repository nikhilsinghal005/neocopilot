// extension.ts
import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { Socket } from 'socket.io-client';
import { StatusBarManager } from './StatusBarManager';
import { versionConfig } from './versionConfig'; // Import the versionConfig module

export async function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  versionConfig.initialize(context);
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);
  
  // Check if the user is logged in before initializing the WebSocket connection
  const isLoggedIn = true //await getIsLoggedIn(context);
  StatusBarManager.initializeStatusBar();  // Initialize status bar on activation
  StatusBarManager.updateMessage('Neo');

  // To handle when the user changes the active text editor
  vscode.window.onDidChangeActiveTextEditor(
    editor => vscodeEventsModule.getCurrentFileName(editor, context), null, context.subscriptions
  );

  // Handle Document Change
  vscode.workspace.onDidChangeTextDocument(
    event => vscodeEventsModule.handleTextChange(event, context), null, context.subscriptions
  );

  // Register the inline completion item provider
  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProviderModule,
  );
  vscode.workspace.getConfiguration().update('editor.quickSuggestions', false);

  // If User is Logged in it Will connect the Websocket
  if (isLoggedIn) {
    const currentVersion = context.extension.packageJSON.version;
    const socketConnection: Socket = socketModule.connect(currentVersion);
  }
}

export function deactivate() {
  // Disconnect the socket when the extension is deactivated
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  socketModule.disconnect();
}
