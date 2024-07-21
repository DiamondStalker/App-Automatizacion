const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    receiveNodeStatus: (callback) => ipcRenderer.on('node-status', (event, data) => callback(event, data)),
    installNode: () => ipcRenderer.send('install-node'),
    downloadRepo: () => ipcRenderer.send('download-repo'),
    closeApp: () => ipcRenderer.send('close-app')
});
