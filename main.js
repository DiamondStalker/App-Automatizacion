const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
const fs = require('fs'); // Para verificar si la carpeta existe

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 420,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
        frame: false, // Desactiva la barra de título y los bordes del sistema
    });

    mainWindow.loadFile('index.html');

    // Verificar la instalación de Node.js
    console.log('Verificando la instalación de Node.js...');
    exec('node -v', (error, stdout, stderr) => {
        if (error) {
            console.error('Node.js no está instalado.');
            mainWindow.webContents.send('node-status', { status: 'not-installed' });
        } else {
            const version = stdout.trim();
            console.log('Node.js está instalado:', version);
            mainWindow.webContents.send('node-status', { status: 'installed', version: version });
        }
    });

    // Verificar si el repositorio ya está descargado
    const documentsPath = path.join(os.homedir(), 'Documents');
    const repoName = 'Automatizacion'; // Nombre de la carpeta del repositorio
    const clonePath = path.join(documentsPath, repoName);

    fs.access(clonePath, fs.constants.F_OK, (err) => {
        if (err) {
            // Carpeta no existe
            mainWindow.webContents.send('repo-status', { status: 'not-exists' });
        } else {
            // Carpeta existe
            mainWindow.webContents.send('repo-status', { status: 'exists' });
        }
    });

    // Escuchar el evento de instalación de Node.js
    ipcMain.on('install-node', () => {
        console.log('Iniciando instalación de Node.js...');
        exec(`
            echo Node.js no está instalado. Instalando...
            powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
            echo Configuración de Chocolatey completada. Instalando Node.js LTS...
            choco install nodejs-lts --version=20.15.1 -y
        `, (error, stdout, stderr) => {
            if (error) {
                console.error('Error instalando Node.js:', error);
            } else {
                console.log('Node.js instalado correctamente:', stdout);
                // Verificar la instalación de Node.js nuevamente
                exec('node -v', (error, stdout, stderr) => {
                    if (error) {
                        console.error('Node.js no está instalado.');
                        mainWindow.webContents.send('node-status', { status: 'not-installed' });
                    } else {
                        const version = stdout.trim();
                        console.log('Node.js está instalado:', version);
                        mainWindow.webContents.send('node-status', { status: 'installed', version: version });
                    }
                });
            }
        });
    });

    // Escuchar el evento de descarga de repositorio
    ipcMain.on('download-repo', () => {
        console.log('Descargando repositorio...');

        const repoUrl = 'https://github.com/DiamondStalker/Automatizacion-Rudy'; // Reemplaza con la URL del repositorio que deseas clonar
        const clonePath = path.join(documentsPath, repoName);

        if (fs.existsSync(clonePath)) {
            console.log('Repositorio ya existe.');
            mainWindow.webContents.send('download-status', { status: 'exists', message: 'El repositorio ya está descargado.' });
        } else {
            const cloneCommand = `git clone ${repoUrl} "${clonePath}"`;

            exec(cloneCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error descargando el repositorio:', error);
                    mainWindow.webContents.send('download-status', { status: 'error', message: error.message });
                } else {
                    console.log('Repositorio descargado correctamente:', stdout);
                    mainWindow.webContents.send('download-status', { status: 'success', message: 'Repositorio descargado correctamente.' });
                    // Actualiza el estado del repositorio después de la descarga
                    mainWindow.webContents.send('repo-status', { status: 'exists' });
                }
            });
        }
    });

    // Escuchar el evento de cierre de la aplicación
    ipcMain.on('close-app', () => {
        console.log('Cerrando la aplicación...');
        app.quit();
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
