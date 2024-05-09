import * as vscode from 'vscode';
import { SocketModule } from './socketModule';
import { VscodeEventsModule } from './vscodeEventsModule';
import { CompletionProviderModule } from './completionProviderModule';
import { AiChatPanel } from './providers/AiChatPanel';
import {storeTokens} from './utilities/secretStore'

export function activate(context: vscode.ExtensionContext) {
  const completionProviderModule = new CompletionProviderModule();
  const socketModule = new SocketModule(completionProviderModule);
  const vscodeEventsModule = new VscodeEventsModule(socketModule);

  vscode.window.onDidChangeActiveTextEditor(
    // To handle when the user changes the active text editor
    editor => vscodeEventsModule.getCurrentFileName(editor, context), null, context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    event => vscodeEventsModule.handleTextChange(event, context), null, context.subscriptions
  );

  // Register the inline completion item provider
  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProviderModule,
    );
  vscode.workspace.getConfiguration().update('editor.quickSuggestions', false);

  const aiChatPanelProvider = new AiChatPanel(context.extensionUri);
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
        const accessToken = query.get('access_token');
        const refreshToken = query.get('refresh_token');
        const idToken = query.get('id_token');
  
        if (accessToken && refreshToken && idToken) {
          console.log('Received tokens:', { accessToken, refreshToken, idToken });
          try {
            await storeTokens(context.secrets, extensionId, accessToken, refreshToken, idToken);
            aiChatPanelProvider.updateViewWithToken(accessToken);

            vscode.window.showInformationMessage('You are logged in successfully!');
          } catch (error) {
            console.error('Failed to store tokens:', error);
            vscode.window.showErrorMessage('Failed to authenticate due to storage issue.');
          }
        } else {
          console.error('Tokens were not provided correctly.');
          vscode.window.showErrorMessage('Failed to authenticate. Tokens missing.');
        }
      } else {
        console.error('Unexpected URI path:', uri.path);
      }
    }
  });

  // // Register a command for starting the authentication process
  // const signInCommand = vscode.commands.registerCommand(`${extensionId}.signin`, async () => {
  //   const callbackUri = await vscode.env.asExternalUri(
  //     vscode.Uri.parse(`${vscode.env.uriScheme}://${extensionId}/auth-complete`)
  //   );
  //   vscode.env.clipboard.writeText(callbackUri.toString());
  //   await vscode.window.showInformationMessage(
  //     'Open the URI copied to the clipboard in a browser window to authorize.'
  //   );
  // });
  // context.subscriptions.push(signInCommand);
}

