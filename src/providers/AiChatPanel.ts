import * as vscode from 'vscode';
import { getNonce } from "../utilities/getNonce";
import { getUri } from "../utilities/getUri";
import {getIsLoggedIn, setIsLoggedIn} from "../utilities/logInStatus";
import {getSecret} from "../utilities/getSecret";
import {verifyAccessToken} from '../utilities/accessTokenVerification'
import {SOCKET_API_BASE_URL } from '../config';
import { Socket } from 'socket.io-client';

// import {setupChat, renderMessages} from "../webview/main"

export class AiChatPanel implements vscode.WebviewViewProvider {

    private _view?: vscode.WebviewView;
    private _doc?: vscode.TextDocument;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _main_context: vscode.ExtensionContext
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

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
                this.visibilityStateFunction(webviewView)
            }
        });
    }

    public async updateViewWithToken(accessToken: string) {
        if (this._view) {
            await setIsLoggedIn(this._main_context.secrets, true)
            this.visibilityStateFunction(this._view)
        }
    }

    private async restartStateFunction(webviewView: vscode.WebviewView) {
        const accessToken: string | undefined = await getSecret(this._main_context, "accessToken")
        const idToken: string | undefined = await getSecret(this._main_context, "idToken")
        if (accessToken!=undefined){
            const isLogged: Boolean = await getIsLoggedIn(this._main_context);
            const isValid = await verifyAccessToken(accessToken);
            if (isLogged && isValid){
                webviewView.webview.html = this._getHtmlForChatWebview(webviewView.webview, SOCKET_API_BASE_URL);
            }else{
                await setIsLoggedIn(this._main_context.secrets, false)
                webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, SOCKET_API_BASE_URL);
            }
        }else{
            await setIsLoggedIn(this._main_context.secrets, false)
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, SOCKET_API_BASE_URL);
        }
    }

    private async visibilityStateFunction(webviewView: vscode.WebviewView) {
        const isLogged: Boolean = await getIsLoggedIn(this._main_context);
        console.log(isLogged)
        if (isLogged) {
            webviewView.webview.html = this._getHtmlForChatWebview(webviewView.webview, SOCKET_API_BASE_URL);
        } else {
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, SOCKET_API_BASE_URL);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, URL:string): string {
        const nonce = getNonce();
        // Paths to the toolkit and Codicon stylesheets
        const toolkitUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/webview-ui-toolkit', 'dist', 'toolkit.js'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'main.js'));
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
                    connect-src ${webview.cspSource} https: http: ${URL};
                ">              
                <title>AI Chat Panel</title>
                <link rel="stylesheet" type="text/css" href="${codiconsUri}" nonce="${nonce}">
                <script nonce="${nonce}" type="module" src="${toolkitUri}"></script>
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

    private _getHtmlForChatWebview(webview: vscode.Webview, URL: string): string {
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
                    connect-src ${webview.cspSource} https: http: ${URL};
                ">              
                <link rel="stylesheet" type="text/css" href="${codiconsUri}" nonce="${nonce}">
                <script nonce="${nonce}" type="module" src="${toolkitUri}"></script>
                <link rel="stylesheet" type="text/css" href="${styleUri}">
                <link rel="stylesheet" type="text/css" href="${highlightUri}">
                <style>
                    .coming-soon-container {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        text-align: center;
                    }
                    .coming-soon-icon {
                        font-size: 50px;
                        margin-bottom: 20px;
                    }
                    .coming-soon-text {
                        font-size: 24px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body style="margin:0; padding:0;">
                <div class="coming-soon-container">
                    <span class="codicon codicon-smiley coming-soon-icon"></span>
                    <div class="coming-soon-text">Chat Coming Soon!</div>
                </div>
                <script nonce="${nonce}" type="module" src="${webviewUri}"></script>
            </body>
            </html>
        `;
    }
    
}

