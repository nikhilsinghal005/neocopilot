const { ipcRenderer } = require('electron');

window.electron = {
    sendMessage: (message) => ipcRenderer.send('sendMessage', message),
    onMessageReceived: (callback) => ipcRenderer.on('messageReceived', callback)
};
