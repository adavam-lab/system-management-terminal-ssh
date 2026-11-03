const { app, ipcMain } = require('electron');
const { createContainer } = require('./electron/container');
const { registerIpcHandlers } = require('./electron/ipc');

/**
 * Punto de entrada de Electron. Solo arranca la app:
 * la lógica vive en electron/ (repositorios → servicios → handlers IPC).
 */
const container = createContainer(app);
registerIpcHandlers(ipcMain, container);

app.on('ready', () => {
  container.database.open();
  container.mainWindow.create();
});

// No dejar procesos ssh (túneles de escritorio remoto) vivos al salir
app.on('before-quit', () => {
  container.vncBridgeService.closeAll();
  container.sshTunnelService.closeAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!container.mainWindow.instance) container.mainWindow.create();
});
