const CH = require('./channels');

function registerRustDeskHandlers(ipcMain, { rustDeskService }) {
  ipcMain.handle(CH.RUSTDESK_STATUS, () => rustDeskService.status());
  ipcMain.handle(CH.RUSTDESK_LAUNCH, (_e, connectionId) => rustDeskService.launch(connectionId));
}

module.exports = { registerRustDeskHandlers };
