const CH = require('./channels');

function registerGroupingHandlers(ipcMain, { groupingService }) {
  ipcMain.handle(CH.GET_PROJECTS, () => groupingService.getProjects());
  ipcMain.handle(CH.ADD_PROJECT, (_e, data) => groupingService.addProject(data));
  ipcMain.handle(CH.UPDATE_PROJECT, (_e, data) => groupingService.updateProject(data));
  ipcMain.handle(CH.DELETE_PROJECT, (_e, id) => groupingService.deleteProject(id));

  ipcMain.handle(CH.GET_CATALOGS, () => groupingService.getCatalogs());
  ipcMain.handle(CH.ADD_CATALOG, (_e, data) => groupingService.addCatalog(data));
  ipcMain.handle(CH.UPDATE_CATALOG, (_e, data) => groupingService.updateCatalog(data));
  ipcMain.handle(CH.DELETE_CATALOG, (_e, id) => groupingService.deleteCatalog(id));
}

module.exports = { registerGroupingHandlers };
