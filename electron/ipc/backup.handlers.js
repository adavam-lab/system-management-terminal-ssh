const path = require('path');
const { dialog } = require('electron');
const CH = require('./channels');
const { BACKUP_EXTENSIONS } = require('../config');
const { fileTimestamp } = require('../utils/time');

const FILE_FILTERS = [{ name: 'SQLite', extensions: BACKUP_EXTENSIONS }];
const RESTORE_CHOICE = { REPLACE: 0, MERGE: 1, CANCEL: 2 };
const CANCELED = { ok: false, canceled: true };

/** Orquesta los diálogos nativos y delega el trabajo en BackupService. */
function registerBackupHandlers(ipcMain, { app, mainWindow, backupService, sshSessionService, authService }) {
  ipcMain.handle(CH.DB_BACKUP, async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow.instance, {
      title: 'Exportar base de datos',
      defaultPath: path.join(app.getPath('documents'), `ssh-manager-backup-${fileTimestamp()}.db`),
      filters: FILE_FILTERS,
    });
    if (canceled || !filePath) return CANCELED;
    await backupService.exportTo(filePath);
    return { ok: true, path: filePath };
  });

  ipcMain.handle(CH.DB_RESTORE, async (_e, { currentUserId } = {}) => {
    const source = await askBackupFile(mainWindow.instance);
    if (!source) return CANCELED;
    backupService.validateBackupFile(source);

    const choice = await askRestoreMode(mainWindow.instance);
    if (choice === RESTORE_CHOICE.CANCEL) return CANCELED;

    // Copia de seguridad automática de la DB actual
    const safetyPath = path.join(app.getPath('userData'), `ssh-manager.pre-restore-${fileTimestamp()}.db`);
    await backupService.exportTo(safetyPath);

    // Las conexiones de las sesiones abiertas pueden dejar de existir
    sshSessionService.closeAll();

    const mode = choice === RESTORE_CHOICE.REPLACE ? 'replace' : 'merge';
    if (mode === 'replace') backupService.replaceWith(source, safetyPath);
    else backupService.mergeFrom(source);

    return { ok: true, mode, safetyPath, userStillExists: authService.userExists(currentUserId) };
  });
}

async function askBackupFile(win) {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Restaurar base de datos',
    properties: ['openFile'],
    filters: FILE_FILTERS,
  });
  return canceled || !filePaths?.length ? null : filePaths[0];
}

async function askRestoreMode(win) {
  const { response } = await dialog.showMessageBox(win, {
    type: 'question',
    title: 'Restaurar base de datos',
    message: '¿Cómo quieres importar este respaldo?',
    detail:
      'Reemplazar: la base de datos actual se sustituye por el respaldo.\n' +
      'Combinar: se agregan los registros del respaldo que no existan todavía.\n\n' +
      'En ambos casos se guarda una copia de seguridad de la base actual antes de modificarla.',
    buttons: ['Reemplazar', 'Combinar', 'Cancelar'],
    defaultId: RESTORE_CHOICE.MERGE,
    cancelId: RESTORE_CHOICE.CANCEL,
  });
  return response;
}

module.exports = { registerBackupHandlers };
