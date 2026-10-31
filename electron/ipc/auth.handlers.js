const CH = require('./channels');

function registerAuthHandlers(ipcMain, { authService }) {
  ipcMain.handle(CH.AUTH_HAS_USERS, () => authService.hasUsers());
  ipcMain.handle(CH.AUTH_LOGIN, (_e, credentials) => authService.login(credentials));
  ipcMain.handle(CH.AUTH_REGISTER, (_e, data) => authService.register(data));
  ipcMain.handle(CH.AUTH_RECOVER_PASSWORD, (_e, data) => authService.recoverPassword(data));
}

module.exports = { registerAuthHandlers };
