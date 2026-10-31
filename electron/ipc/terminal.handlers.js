const CH = require('./channels');

function registerTerminalHandlers(ipcMain, { sshSessionService }) {
  ipcMain.handle(CH.START_SSH, (_e, options) => sshSessionService.start(options));
  ipcMain.handle(CH.CLOSE_SSH, (_e, id) => sshSessionService.close(id));
  // Tras refrescar la ventana las terminales del renderer se pierden: cerrar huérfanas
  ipcMain.handle(CH.CLOSE_ALL_SSH, () => sshSessionService.closeAll());

  ipcMain.on(CH.TERMINAL_KEYSTROKE, (_e, { id, key }) => sshSessionService.write(id, key));
  ipcMain.on(CH.TERMINAL_RESIZE, (_e, { id, cols, rows }) => sshSessionService.resize(id, cols, rows));
}

module.exports = { registerTerminalHandlers };
