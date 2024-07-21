const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    receiveNodeStatus: (callback) => ipcRenderer.on('node-status', callback),
    receiveRepoStatus: (callback) => ipcRenderer.on('repo-status', callback),
    receiveDownloadStatus: (callback) => ipcRenderer.on('download-status', callback),
    installNode: () => ipcRenderer.send('install-node'),
    downloadRepo: () => ipcRenderer.send('download-repo'),
    closeApp: () => ipcRenderer.send('close-app')
});
