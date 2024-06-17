import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextField } from '@vscode/webview-ui-toolkit';
import './style.css';
import { LOGIN_REDIRECT_URL} from '../config';

const vscode = acquireVsCodeApi();

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextField());
window.addEventListener("load", main);

function main() {
    const loginButton = document.getElementById("login-button");
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            // Send a message to the extension to open the URL
            vscode.postMessage({
                command: 'openBrowser',  // Make sure this matches in your AiChatPanel.ts
                url: LOGIN_REDIRECT_URL
            });            
        });
    }
}

window.addEventListener('message', event => {
    const message = event.data; // The JSON data sent from the extension
    switch (message.command) {
        case 'update':
        }
});
