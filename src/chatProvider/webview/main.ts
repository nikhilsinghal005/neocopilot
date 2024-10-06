// src/chatProvider/webview/main.ts

import './main.css';
import { SOCKET_API_BASE_URL, LOGIN_REDIRECT_URL } from '../../config';
import { SocketModule } from '../../socketModule';
import { generateChatId } from '../../utilities/basicUtilities';
console.log('Neo: Event listener for when the message Received');

// Declare the acquireVsCodeApi function
declare function acquireVsCodeApi(): any;

// Initialize the VSCode API
const vscode = acquireVsCodeApi();
const socketModule = SocketModule.getInstance();

// Define the message interface
interface Message {
    messageContent: string;
    messageFrom: 'user' | 'ai';
    chatId: string;
}

// Initialize an empty messages array
const messages: Message[] = [];

// Event listener for when the window loads
window.addEventListener("load", main);

function main() {
    const sendButton = document.getElementById("send-button") as HTMLElement;
    const messageInput = document.getElementById("message-input") as HTMLTextAreaElement;
    const messageList = document.getElementById("message-list") as HTMLElement;
    const loginButton = document.getElementById("login-button") as HTMLElement;
    console.log('Neo: Event listener for when the message Received');

    // Handle send button click
    if (sendButton && messageInput && messageList) {
        console.log('Neo: Event listener for when the message Received');
        sendButton.addEventListener("click", () => {
            console.log('Neo: Send Button clicked');
            const messageContent = messageInput.value.trim();
            if (messageContent) {
                appendMessage({ messageContent, messageFrom: 'user', chatId: generateChatId() });
                messageInput.value = '';
                sendMessageToExtension(messageContent);
            }
        });

        // Handle Enter key for sending messages
        messageInput.addEventListener("keydown", (event) => {
            console.log('Neo: Key Down Button clicked');

            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendButton.click();
            }
        });

        // Optional: Auto-resize textarea based on content
        messageInput.addEventListener("input", () => {
            autoResizeTextarea(messageInput);
        });
    }

    // Handle login button click (if present)
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            // Send a message to the extension to open the URL
            vscode.postMessage({
                command: 'openBrowser',
                url: LOGIN_REDIRECT_URL
            });            
        });
    }

    // Listen for messages from the extension
    window.addEventListener("message", event => {
        const message = event.data; // The JSON data our extension sent
        switch (message.command) {
            case 'aiResponse':
                appendMessage({ messageContent: message.text, messageFrom: 'ai', chatId: generateChatId() });
                break;
            // Handle other message types if necessary
        }
    });

    // Restore messages on load
    restoreMessages();
}

/**
 * Appends a message to the message list in the webview.
 * @param msg - The message to append.
 */
function appendMessage(msg: Message) {
    const messageList = document.getElementById("message-list") as HTMLElement;
    console.log('Neo: Appending message', msg);
    if (messageList) {
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('message-bubble', `${msg.messageFrom}-message`);
        messageBubble.innerHTML = `<p>${escapeHtml(msg.messageContent)}</p>`;
        messageList.appendChild(messageBubble);
        // Scroll to the bottom
        messageList.scrollTop = messageList.scrollHeight;

        // Save to state
        messages.push(msg);
        vscode.setState({ messages });
    } else {
        console.error('Neo: messageList element not found');
    }
}

/**
 * Sends the user's message to the extension backend.
 * @param message - The message content to send.
 */
function sendMessageToExtension(message: string) {
    vscode.postMessage({
        command: 'sendMessage',
        text: message
    });
}

/**
 * Escapes HTML to prevent XSS attacks.
 * @param unsafe - The string to escape.
 * @returns The escaped string.
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Automatically resizes the textarea based on its content.
 * @param textarea - The textarea element to resize.
 */
function autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Restores chat messages from the webview state.
 */
function restoreMessages() {
    const state = vscode.getState();
    if (state && state.messages) {
        state.messages.forEach((msg: Message) => {
            appendMessage(msg);
        });
    }
}
