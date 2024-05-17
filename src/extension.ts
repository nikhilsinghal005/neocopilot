import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { AiChatPanel } from './providers/AiChatPanel';
import {storeTokens} from './utilities/secretStore'
import {verifyAccessToken} from './utilities/accessTokenVerification'

export function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);

  vscode.window.onDidChangeActiveTextEditor(
    // To handle when the user changes the active text editor
    editor => vscodeEventsModule.getCurrentFileName(editor, context), null, context.subscriptions
  );

  // const disposable = vscode.window.onDidChangeTextEditorSelection(vscodeEventsModule.handleCursorChange);
  // context.subscriptions.push(disposable);

  vscode.workspace.onDidChangeTextDocument(
    event => vscodeEventsModule.handleTextChange(event, context), null, context.subscriptions
  );

  // Register the inline completion item provider
  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProviderModule,
    );
  vscode.workspace.getConfiguration().update('editor.quickSuggestions', false);

  const aiChatPanelProvider = new AiChatPanel(context.extensionUri, context);
  let view = vscode.window.registerWebviewViewProvider(
      'aiChatPanel',
      aiChatPanelProvider
  );
  context.subscriptions.push(view);

  // Register URI handler for OAuth callback
  const extensionId = 'vidyutdatalabs.codebuddy';
  vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri): Promise<void> {
      if (uri.path === '/token') {
        const query = new URLSearchParams(uri.query);
        const accessToken: string | null = query.get('access_token');
        const refreshToken: string | null = query.get('refresh_token');
        const idToken: string | null = query.get('id_token');
  
        if (accessToken) {
          const isValid = await verifyAccessToken(accessToken);
          if (isValid) {
            if (refreshToken && idToken) {
              await storeTokens(context.secrets, extensionId, accessToken, refreshToken, idToken);
              await aiChatPanelProvider.updateViewWithToken(accessToken);
            } else {
              console.error('Refresh token or ID token missing.');
            }
          } else {
            console.error('Invalid access token');
          }
  }}}});

  const authUrl = 'http://localhost:3000';
  setTimeout(() => {
    promptUserForAuthentication(authUrl);
  }, 30000);
}


async function promptUserForAuthentication(url: string) {
  const result = await vscode.window.showInformationMessage(
    "Login to use CodeBuddy chat and inline code completion",
    "LogIn", "Cancel"
  );
  if (result === "LogIn") {
    await vscode.env.openExternal(vscode.Uri.parse(url));
  }
}