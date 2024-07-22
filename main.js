const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 500,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
        frame: false,
    });

    mainWindow.loadFile('index.html');

    const sendOutput = (output) => {
        mainWindow.webContents.send('command-output', { output });
    };

    sendOutput('Validando Existencia de Node\n');

    // Verificar la instalación de Node.js
    exec('node -v', (error, stdout) => {
        if (error) {
            mainWindow.webContents.send('node-status', { status: 'not-installed' });
            sendOutput('Node no se encuentra instalado \n');
        } else {
            const version = stdout.trim();
            mainWindow.webContents.send('node-status', { status: 'installed', version: version });
            sendOutput('Node se encuentra instalado \n');
        }
    });

    // Verificar si el repositorio ya existe
    const documentsPath = path.join(os.homedir(), 'Documents');
    const repoName = 'Automatizacion';
    const repoPath = path.join(documentsPath, repoName);

    if (fs.existsSync(repoPath)) {
        mainWindow.webContents.send('repo-status', { status: 'exists' });
    } else {
        mainWindow.webContents.send('repo-status', { status: 'not-exists' });
    }

    // Escuchar el evento de instalación de Node.js
    ipcMain.on('install-node', () => {
        exec(`
            echo Node.js no está instalado. Instalando...
            powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
            echo Configuración de Chocolatey completada. Instalando Node.js LTS...
            choco install nodejs-lts --version=20.15.1 -y
        `, (error, stdout) => {
            if (error) {
                sendOutput('Error instalando Node.js:', error);
            } else {
                exec('node -v', (error, stdout) => {
                    if (error) {
                        mainWindow.webContents.send('node-status', { status: 'not-installed' });
                    } else {
                        const version = stdout.trim();
                        mainWindow.webContents.send('node-status', { status: 'installed', version: version });
                    }
                });
            }
        });
    });

    // Escuchar el evento de descarga de repositorio
    ipcMain.on('download-repo', () => {
        const repoUrl = 'https://github.com/DiamondStalker/Automatizacion-Rudy'; // Reemplaza con la URL del repositorio que deseas clonar
        const cloneCommand = `git clone ${repoUrl} "${repoPath}"`;

        exec(cloneCommand, (error, stdout) => {
            if (error) {
                sendOutput('Error descargando el repositorio:', error);
                mainWindow.webContents.send('download-status', { status: 'error', message: error.message });
            } else {
                sendOutput('Repositorio descargado correctamente:', stdout);
                mainWindow.webContents.send('download-status', { status: 'success', message: 'Repositorio descargado correctamente.' });
                mainWindow.webContents.send('repo-status', { status: 'exists' });
            }
        });
    });

    // Escuchar el evento de verificación de node_modules
    ipcMain.on('check-node-modules', () => {
        const documentsPath = path.join(os.homedir(), 'Documents');
        const repoName = 'Automatizacion';
        const repoPath = path.join(documentsPath, repoName);
        const nodeModulesPath = path.join(repoPath, 'node_modules');
    
        // const sendOutput = (output) => {
        //     mainWindow.webContents.send('command-output', { output });
        // };
    
        if (!fs.existsSync(nodeModulesPath)) {
            exec(`cd "${repoPath}" && npm install`, (error, stdout, stderr) => {
                sendOutput(stdout);
                if (error) {
                    sendOutput(`Error ejecutando npm install: ${error.message}`);
                }
                sendOutput(stderr);
                
                exec(`cd "${repoPath}" && npm run start`, (error, stdout, stderr) => {
                    sendOutput(stdout);
                    if (error) {
                        sendOutput(`Error ejecutando npm run start: ${error.message}`);
                    }
                    sendOutput(stderr);
                });
            });
        } else {
            exec(`cd "${repoPath}" && npm run start`, (error, stdout, stderr) => {
                sendOutput(stdout);
                if (error) {
                    sendOutput(`Error ejecutando npm run start: ${error.message}`);
                }
                sendOutput(stderr);
            });
        }
    });
    
    

    // Escuchar el evento de cierre de la aplicación
    ipcMain.on('close-app', () => {
        app.quit();
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
