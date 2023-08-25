import * as vscode from 'vscode';

export class AiChatPanel implements vscode.WebviewViewProvider {

    private _view?: vscode.WebviewView;
    private _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'showWarning':
                    vscode.window.showWarningMessage(data.message);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
      // Use a nonce to only allow specific scripts to be run
      const nonce = getNonce();
  
      return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>AI Chat Panel</title>
          </head>
          <body style="margin:0; padding:0; display:flex; flex-direction:column; height:100vh;">
              <div id="chatHistory" style="flex: 1; overflow-y: auto; padding: 10px; border-bottom: 1px solid #ccc;"></div>
              <div style="display: flex; padding: 10px; background-color: #f5f5f5;">
                  <input id="chatInput" type="text" style="flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #ccc;" placeholder="Type your message...">
                  <button id="sendButton" style="margin-left: 10px; padding: 5px 15px; border: none; border-radius: 4px; background-color: #007acc; color: white; cursor: pointer;">Send</button>
              </div>
              <script nonce="${nonce}">
                  // We will add the JavaScript for handling chat input and button click here in the next steps.
              </script>
          </body>
          </html>
      `;
  }
  
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
