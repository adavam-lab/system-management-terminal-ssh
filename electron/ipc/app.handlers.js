const CH = require('./channels');

function registerAppHandlers(ipcMain, { app, sshSessionService }) {
  // Cierre por inactividad solicitado por el renderer
  ipcMain.handle(CH.APP_QUIT_IDLE, () => {
    sshSessionService.closeAll();
    app.quit();
    return true;
  });
}

module.exports = { registerAppHandlers };
