// In Electron's main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws'); // Import ws
let mainWindow;

// Set up WebSocket connection
const socket = new WebSocket('ws://localhost:4001'); // Replace with your VSCode extension's server URL

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 300,
        height: 150,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simplicity in this example
            preload: path.join(__dirname, 'preload.js') // You can use a preload file if you want better isolation
        }
    });
    mainWindow.loadFile('index.html');
});

// Listen for messages from the renderer process
ipcMain.on('sendMessage', (event, message) => {
    console.log('Received message:', message); // Handle the message
    
    // Send message to VSCode extension via WebSocket
    socket.send(message.toString()); // Use native WebSocket send() method
    
    // Optionally, send a reply back to the renderer
    event.reply('messageReceived', 'Message sent to VSCode extension!');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
