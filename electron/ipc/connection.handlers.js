const CH = require('./channels');

function registerConnectionHandlers(ipcMain, { connectionService }) {
  ipcMain.handle(CH.GET_CONNECTIONS, () => connectionService.getAll());
  ipcMain.handle(CH.ADD_CONNECTION, (_e, conn) => connectionService.add(conn));
  ipcMain.handle(CH.UPDATE_CONNECTION, (_e, conn) => connectionService.update(conn));
  ipcMain.handle(CH.DELETE_CONNECTION, (_e, id) => connectionService.delete(id));
}

module.exports = { registerConnectionHandlers };
