import * as vscode from 'vscode';
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import {getIsLoggedIn, setIsLoggedIn} from "../utilities/logInStatus";

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

        // webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        this.restartStateFunction(webviewView)
        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'openBrowser':
                    // Show a confirmation dialog before opening the URL
                    const result = await vscode.window.showInformationMessage(
                        "You will be redirected to an external site for authentication. Continue?",
                        "Continue", "Cancel"
                    );
                    if (result === "Continue") {
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                    }
                    break;
                // Handle other messages as necessary
            }
        }); 

        webviewView.onDidChangeVisibility(() => {
            if (this._view?.visible) {
                // You might want to check some condition here
                this.visibilityStateFunction(webviewView)
            }
        });
    }

    public updateViewWithToken(accessToken: string) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'update',
                accessToken: accessToken
            });
        }
    }

    public userAlreadyLoggedIn() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'alreadyLoggedIn'
            });
        }
    }

    private async restartStateFunction(webviewView: vscode.WebviewView) {
        const isLogged: Boolean = false;
        if (isLogged) {
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
            this.userAlreadyLoggedIn();
            console.log("Status is True");
        } else {
            console.log("Unable to provide data");
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        }
    }

    private async visibilityStateFunction(webviewView: vscode.WebviewView) {
        const isLogged: Boolean = true;
        if (isLogged) {
            this.userAlreadyLoggedIn();
            console.log("Status is True");
        } else {
            console.log("Unable to provide data");
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const nonce = getNonce();
        // Paths to the toolkit and Codicon stylesheets
        const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/webview-ui-toolkit', 'dist', 'toolkit.js'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'main.css'));
        const highlightUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', 'highlight.js', 'styles', 'default.css'));
        
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content=" 
                    default-src 'none'; 
                    img-src ${webview.cspSource} https:;
                    script-src 'nonce-${nonce}' ${webview.cspSource} 'unsafe-inline' 'unsafe-eval';
                    style-src 'self' ${webview.cspSource} 'unsafe-inline';
                    font-src ${webview.cspSource} https:;
                    connect-src ${webview.cspSource} https: http: ws://localhost:5000;
                ">              
                <title>AI Chat Panel</title>
                <link rel="stylesheet" type="text/css" href="${codiconsUri}" nonce="${nonce}">
                <script nonce="${nonce}" type="module" src="${toolkitUri}"></script>
                <link rel="stylesheet" type="text/css" href="${styleUri}">
                <link rel="stylesheet" type="text/css" href="${highlightUri}">

            </head>
            <body style="margin:0; padding:0; display:flex; flex-direction:column;">
                <div style="margin:0; padding:0; display:flex; flex-direction:column;">
                    <h4 style="padding:0; text-align:center; margin-top:40%">Welcome! Please log in or sign up to continue.</h4>
                    <vscode-button 
                        id="login-button"    
                        style="padding:0; margin-left:10%; margin-right:10%; margin-top:1%; margin-bottom:3%;">
                        Login
                    </vscode-button>
                    <vscode-button style="padding:0; margin-left:10%; margin-right:10%; margin-top:1%; margin-bottom:1%;">Create Account</vscode-button>
                </div>
                <script nonce="${nonce}" type="module" src="${webviewUri}"></script>
            </body>
            </html>
        `;
    }   
}

