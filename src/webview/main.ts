import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextField } from '@vscode/webview-ui-toolkit';
import './style.css';
import hljs from 'highlight.js';
import { SOCKET_API_BASE_URL, LOGIN_REDIRECT_URL} from '../config';
import { io, Socket } from 'socket.io-client';

const vscode = acquireVsCodeApi();
let socket: Socket;

interface Message {
    messageContent: string;
    messageFrom: string;
    chatId: string;
}

const messages: Message[] = []; // This should solve the issue

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextField());
window.addEventListener("load", main);
window.addEventListener("load", setupChat);
window.addEventListener("load", renderMessages);

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
            socket = message.socketConnection;
        }
});

function setupChat() {
    const sendButton = document.getElementById('send-button') as HTMLButtonElement | null;
    const messageInput = document.getElementById('message-input') as HTMLInputElement | null;
    const chatContainer = document.getElementById('chat-container') as HTMLElement | null;

    if (sendButton && messageInput && chatContainer) {
        const sendMessage = (message) => {
            if (message) {
                const messageData = { messageContent: message, messageFrom: "user",  chatId: "1"};
                messages.push(messageData);
                displayMessage(messageData, chatContainer);
                if (socket){
                    socket.emit('chat_message', { message: message });
                }
                messageInput.value = '';
            }
        };

        sendButton.addEventListener('click', () => {
            if (messageInput.value) {
                sendMessage(messageInput.value);
            }
        });

        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                if (messageInput.value) {
                    sendMessage(messageInput.value);
                    event.preventDefault();
                }
            }
        });
        socket?.on('chat_response', (data) => {
            if (data.message) {
                let lastMessage = messages[messages.length - 1];
                if (data.message_id === lastMessage.chatId) {
                    lastMessage.messageContent += data.message;
                    updateLastMessageDisplay(lastMessage, chatContainer);
                } else {
                    const messageData = { messageContent: data.message, messageFrom: "system", chatId: data.message_id };
                    messages.push(messageData);
                    displayMessage(messageData, chatContainer);
                }
            }
        });
    }
}

function updateLastMessageDisplay(messageData, container) {
    const lastMessageElement = container.lastElementChild;
    if (lastMessageElement) {
        lastMessageElement.textContent = ''; // Clear existing content
        processMessageContent(messageData.messageContent, lastMessageElement);
    }
}

function processMessageContent(content, messageElement) {
    const segments = content.split(/(```[\w-]*\n[\s\S]*?\n```)/g);
    segments.forEach(segment => {
        if (segment.startsWith('```')) {
            const match = segment.match(/```(\w+)?\n([\s\S]*?)\n```/);
            if (match && match[2]) {
                const language = match[1] || "plaintext";
                const codeText = match[2];

                const codeContainer = document.createElement('div');
                codeContainer.classList.add('code-container');

                const header = document.createElement('div');
                header.classList.add('code-header');
                header.textContent = language.toUpperCase(); // Add language to the header

                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-button');
                copyButton.textContent = 'Copy';
                copyButton.onclick = function () {
                    navigator.clipboard.writeText(codeText);
                };

                header.appendChild(copyButton);
                codeContainer.appendChild(header);

                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = codeText;
                pre.appendChild(code);
                codeContainer.appendChild(pre);

                hljs.highlightElement(code); // Apply syntax highlighting

                messageElement.appendChild(codeContainer);
            }
        } else {
            const textSegment = document.createElement('span');
            textSegment.textContent = segment;
            messageElement.appendChild(textSegment);
        }
    });
}

function displayMessage(messageData, container) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(messageData.messageFrom === "user" ? "user-msg" : "system-msg");

    // Split the message content into text and code segments
    const segments = messageData.messageContent.split(/(```[\w-]*\n[\s\S]*?\n```)/g);

    // Process each segment
    segments.forEach((segment) => {
        if (segment.startsWith('```')) {
            const match = segment.match(/```(\w+)?\n([\s\S]*?)\n```/);
            if (match && match[2]) {
                const language = match[1] || "plaintext";
                const codeText = match[2];

                const codeContainer = document.createElement('div');
                codeContainer.classList.add('code-container');

                const header = document.createElement('div');
                header.classList.add('code-header');
                header.textContent = language.toUpperCase(); // Add language to the header

                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-button');
                copyButton.textContent = 'Copy';
                copyButton.onclick = function () {
                    navigator.clipboard.writeText(codeText);
                };

                header.appendChild(copyButton);
                codeContainer.appendChild(header);

                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = codeText;
                pre.appendChild(code);
                codeContainer.appendChild(pre);

                hljs.highlightElement(code); // Apply syntax highlighting

                messageElement.appendChild(codeContainer);
            }
        } else {
            // This segment is regular text
            const textSegment = document.createElement('span');
            textSegment.textContent = segment;
            messageElement.appendChild(textSegment);
        }
    });

    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
}

function renderMessages() {
    const chatContainer = document.getElementById('chat-container') as HTMLElement | null;
    if (chatContainer) {
        chatContainer.innerHTML = ''; // Clear existing messages
        messages.forEach(messageData => displayMessage(messageData, chatContainer));
    }
}
