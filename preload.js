//@ts-check

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    receiveNodeStatus: (callback) => ipcRenderer.on('node-status', callback),
    statusExecute: (callback) => ipcRenderer.on('execute-status', callback),
    receiveRepoStatus: (callback) => ipcRenderer.on('repo-status', callback),
    receiveDownloadStatus: (callback) => ipcRenderer.on('download-status', callback),
    receiveCommandOutput: (callback) => ipcRenderer.on('command-output', callback),
    receiveGitStatus: (callback) => ipcRenderer.on('git-status', callback),
    installGit: () => ipcRenderer.send('install-git'),
    installNode: () => ipcRenderer.send('install-node'),
    downloadRepo: () => ipcRenderer.send('download-repo'),
    checkNodeModules: () => ipcRenderer.send('check-node-modules'),
    stopProcess: () => ipcRenderer.send('stop-process'),
    openExcel: () => ipcRenderer.send('open-excel'),
    closeApp: () => ipcRenderer.send('close-app')
});
