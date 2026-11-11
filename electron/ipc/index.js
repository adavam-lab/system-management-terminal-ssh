const { registerAuthHandlers } = require('./auth.handlers');
const { registerGroupingHandlers } = require('./grouping.handlers');
const { registerConnectionHandlers } = require('./connection.handlers');
const { registerTerminalHandlers } = require('./terminal.handlers');
const { registerBackupHandlers } = require('./backup.handlers');
const { registerRemoteDesktopHandlers } = require('./remote-desktop.handlers');
const { registerRustDeskHandlers } = require('./rustdesk.handlers');

function registerIpcHandlers(ipcMain, container) {
  registerAuthHandlers(ipcMain, container);
  registerGroupingHandlers(ipcMain, container);
  registerConnectionHandlers(ipcMain, container);
  registerTerminalHandlers(ipcMain, container);
  registerBackupHandlers(ipcMain, container);
  registerRemoteDesktopHandlers(ipcMain, container);
  registerRustDeskHandlers(ipcMain, container);
}

module.exports = { registerIpcHandlers };
