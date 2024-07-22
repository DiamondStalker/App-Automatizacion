const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    receiveNodeStatus: (callback) => ipcRenderer.on('node-status', callback),
    receiveRepoStatus: (callback) => ipcRenderer.on('repo-status', callback),
    receiveDownloadStatus: (callback) => ipcRenderer.on('download-status', callback),
    receiveCommandOutput: (callback) => ipcRenderer.on('command-output', callback),
    installNode: () => ipcRenderer.send('install-node'),
    downloadRepo: () => ipcRenderer.send('download-repo'),
    checkNodeModules: () => ipcRenderer.send('check-node-modules'),
    closeApp: () => ipcRenderer.send('close-app')
});
