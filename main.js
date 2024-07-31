const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');
const fs = require('fs');
const kill = require('tree-kill');


let childProcess; // Variable global para almacenar el proceso


function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 500,
        height: 800,
        icon: './assets/app.png',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
        frame: false,
    });

    mainWindow.loadFile('index.html');
    mainWindow.setTitle('App Automatizacion'); // Establecer el título de la ventana


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

    exec('git --version', (error, stdout, stderr) => {
        if (error) {
            sendOutput('Git no esta Instalado \n');
            mainWindow.webContents.send('git-status', { status: 'not-installed' });
        } else {
            mainWindow.webContents.send('git-status', { status: 'installed' });
            sendOutput('Git se encuentra instalado \n');
        }
    });

    // Verificar si el repositorio ya existe
    const documentsPath = path.join(os.homedir(), 'Documents');
    const repoName = 'Automatizacion';
    const repoPath = path.join(documentsPath, repoName);

    sendOutput('Validando Repositorio \n');
    if (fs.existsSync(repoPath)) {
        mainWindow.webContents.send('repo-status', { status: 'exists' });
        sendOutput('Proyecto Automatizacion ya esta descargada\n');
    } else {
        mainWindow.webContents.send('repo-status', { status: 'not-exists' });
        sendOutput('Proyecto Automatizacion no esta descargada\n');
    }

    // Escuchar el evento de instalación de Node.js
    ipcMain.on('install-node', () => {
        exec(`
            echo Node.js no está instalado. Instalando...
            powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
            echo Configuración de Chocolatey completada. Instalando Node.js LTS...
            choco install nodejs-lts --version=20.15.1 -y
        `, (error, stdout) => {
            sendOutput(stdout);
            if (error) {
                sendOutput('Error instalando Node.js:', error);
            } else {
                exec('node -v', (error, stdout) => {
                    if (error) {
                        sendOutput('No se pudo descargar Node...\n');
                        mainWindow.webContents.send('node-status', { status: 'not-installed' });
                    } else {
                        const version = stdout.trim();
                        sendOutput('Se descargo Node...\n');
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
            sendOutput(stdout);
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

    //FIXME - Check-node-modules-and-run
    // Escuchar el evento de verificación de node_modules
    // ipcMain.on('check-node-modules', () => {
    //     const documentsPath = path.join(os.homedir(), 'Documents');
    //     const repoName = 'Automatizacion';
    //     const repoPath = path.join(documentsPath, repoName);
    //     const nodeModulesPath = path.join(repoPath, 'node_modules');

    //     // Verificar si la carpeta node_modules existe
    //     if (!fs.existsSync(nodeModulesPath)) {
    //         // Ejecutar `npm install` y enviar la salida en tiempo real
    //         const installProcess = exec(`cd "${repoPath}" && npm install`);

    //         installProcess.stdout.on('data', (data) => {
    //             mainWindow.webContents.send('command-output', { output: data.toString() });
    //         });

    //         installProcess.stderr.on('data', (data) => {
    //             mainWindow.webContents.send('command-output', { output: data.toString() });
    //         });

    //         installProcess.on('close', (code) => {
    //             if (code === 0) {
    //                 mainWindow.webContents.send('command-output', { output: 'npm install completado, ejecutando npm run start...' });

    //                 // Ejecutar `npm run start` y enviar la salida en tiempo real
    //                 const startProcess = exec(`cd "${repoPath}" && npm run start`);

    //                 startProcess.stdout.on('data', (data) => {
    //                     mainWindow.webContents.send('command-output', { output: data.toString() });
    //                 });

    //                 startProcess.stderr.on('data', (data) => {
    //                     mainWindow.webContents.send('command-output', { output: data.toString() });
    //                 });

    //                 startProcess.on('close', (code) => {
    //                     if (code === 0) {
    //                         mainWindow.webContents.send('command-output', { output: 'npm run start completado.' });
    //                     } else {
    //                         mainWindow.webContents.send('command-output', { output: `Error ejecutando npm run start, código de salida: ${code}` });
    //                     }
    //                 });
    //             } else {
    //                 mainWindow.webContents.send('command-output', { output: `Error ejecutando npm install, código de salida: ${code}` });
    //             }
    //         });
    //     } else {
    //         // Ejecutar `npm run start` y enviar la salida en tiempo real
    //         const startProcess = exec(`cd "${repoPath}" && npm run start`);

    //         startProcess.stdout.on('data', (data) => {
    //             mainWindow.webContents.send('command-output', { output: data.toString() });
    //         });

    //         startProcess.stderr.on('data', (data) => {
    //             mainWindow.webContents.send('command-output', { output: data.toString() });
    //         });

    //         startProcess.on('close', (code) => {
    //             if (code === 0) {
    //                 mainWindow.webContents.send('command-output', { output: 'npm run start completado.' });
    //             } else {
    //                 mainWindow.webContents.send('command-output', { output: `Error ejecutando npm run start, código de salida: ${code}` });
    //             }
    //         });
    //     }
    // });

    ipcMain.on('check-node-modules', () => {
        mainWindow.webContents.send('execute-status', { status: 'exec' });

        childProcess = exec(`cd ${repoPath} && npm i && npm run start`, (error, stdout, stderr) => {
            if (error) {
                sendOutput(`Error ejecutando el comando: ${error}`);
                //event.reply('command-output', `Error: ${error.message}`);
                return;
            }
            //console.log(`stdout: ${stdout}`);
            sendOutput(`stderr: ${stderr}`);
            //event.reply('command-output', stdout);
        });

        childProcess.stdout.on('data', (data) => {
            mainWindow.webContents.send('command-output', { output: data.toString() });
        });

        childProcess.stderr.on('data', (data) => {
            mainWindow.webContents.send('command-output', { output: data.toString() });
        });
    });

    ipcMain.on('stop-process', () => {
        //mainWindow.webContents.send('execute-status', { status: 'no-exec' });

        if (childProcess) {
            kill(childProcess.pid, 'SIGKILL', (err) => {
                if (err) {
                    sendOutput(`Error deteniendo el proceso: ${err}`);
                } else {
                    sendOutput('Proceso detenido');
                }
            });
        } else {
            sendOutput('No hay proceso para detener');
        }
    });


    // Escuchar el evento de cierre de la aplicación
    ipcMain.on('close-app', () => {
        app.quit();
    });

    ipcMain.on('install-git', () => {
        exec('winget install --id Git.Git -e --source winget', (error, stdout, stderr) => {
            if (error) {
                mainWindow.webContents.send('command-output', { output: `Error instalando Git: ${error.message}` });
            } else {
                mainWindow.webContents.send('command-output', { output: stdout });
                mainWindow.webContents.send('git-status', { status: 'installed' });
            }
            mainWindow.webContents.send('command-output', { output: stderr });
        });
    });

    ipcMain.on('open-excel', () => {
        const filePath = path.join(os.homedir(), 'Documents/Automatizacion/Read/Datos.xlsx')

        sendOutput(`${filePath}\n`);
        if (fs.existsSync(filePath)) {
            exec(`start "" "${filePath}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error abriendo el archivo Excel: ${error.message}`);
                    mainWindow.webContents.send('command-output', { output: `Error abriendo el archivo Excel: ${error.message}` });
                } else {
                    mainWindow.webContents.send('command-output', { output: `Archivo Excel abierto correctamente: ${stdout}` });
                }
                if (stderr) {
                    mainWindow.webContents.send('command-output', { output: stderr });
                }
            });
        } else {
            mainWindow.webContents.send('command-output', { output: 'El archivo Excel no existe en la ruta especificada.' });
        }
    });

    ipcMain.on('update-repo', () => {
        sendOutput('Actualizando Repositorio \n');
        const pullCommand = `git -C "${repoPath}" pull`;
        exec(pullCommand, (error, stdout, stderr) => {
            sendOutput(stdout);
            if (error) {
                sendOutput('Error actualizando el repositorio:', error);
                mainWindow.webContents.send('repo-status', { status: 'error', message: error.message });
            } else {
                sendOutput('Repositorio actualizado correctamente:', stdout);
                mainWindow.webContents.send('repo-status', { status: 'updated', message: 'Repositorio actualizado correctamente.' });
            }
        });
    });
}

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('command-output', { output: 'Actualización disponible. Descargando...' });
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('command-output', { output: 'Actualización descargada. Reiniciando para instalar...' });
    autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('command-output', { output: `Error en la actualización: ${error.message}` });
});

app.on('ready', createWindow);
// app.on('ready', () => {
//     createWindow();
//     autoUpdater.checkForUpdatesAndNotify();
// });

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