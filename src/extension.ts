import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { AiChatPanel } from './providers/AiChatPanel';
import { storeTokens } from './utilities/secretStore';
import { verifyAccessToken } from './utilities/accessTokenVerification';
import { getIsLoggedIn, setIsLoggedIn } from "./utilities/logInStatus";
import { LOGIN_REDIRECT_URL } from './config';
import { showLoginNotification } from "./utilities/showLoginNotification";
import { io, Socket } from 'socket.io-client';

export async function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);

  // Check if the user is logged in before initializing the WebSocket connection
  const isLoggedIn = await getIsLoggedIn(context);

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

  // Register a webview for the sidepanel
  const aiChatPanelProvider = new AiChatPanel(context.extensionUri, context);
  let view = vscode.window.registerWebviewViewProvider(
    'aiChatPanel',
    aiChatPanelProvider
  );
  context.subscriptions.push(view);

  // If User is Logged in it Will connect the Websocket
  if (isLoggedIn) {
    const socketConnection: Socket = socketModule.connect();
  }

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
              socketModule.connect();
            } else {
              console.error('Refresh token or ID token missing.');
            }
          } else {
            console.error('Invalid access token');
          }
        }
      }
    }
  });

  // Show login popup on startup
  setTimeout(() => {
    showLoginNotification(LOGIN_REDIRECT_URL, context);
  }, 30000);
}

export function deactivate() {
  // Disconnect the socket when the extension is deactivated
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  socketModule.disconnect();
}