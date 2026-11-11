const fs = require('fs');
const Database = require('better-sqlite3');
const { BACKUP_TABLES } = require('../config');

const SQLITE_HEADER = 'SQLite format 3\0';
const SIDE_FILE_SUFFIXES = ['-wal', '-shm', '-journal'];

/** Exportar / restaurar la base de datos. Sin diálogos: la UI nativa vive en la capa IPC. */
class BackupService {
  constructor(databaseManager) {
    this.database = databaseManager;
  }

  async exportTo(filePath) {
    await this.database.connection.backup(filePath); // copia consistente aunque esté en uso
  }

  /** Verifica que el archivo sea SQLite y tenga las tablas de la app */
  validateBackupFile(filePath) {
    if (!this.hasSqliteHeader(filePath)) {
      throw new Error('El archivo no es una base de datos SQLite válida.');
    }
    const probe = new Database(filePath, { readonly: true, fileMustExist: true });
    try {
      const tables = probe.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name);
      if (!tables.includes('users') || !tables.includes('connections')) {
        throw new Error('El archivo no corresponde a una base de datos de XSSH Manager.');
      }
    } finally {
      probe.close();
    }
  }

  /** La base actual se sustituye por el respaldo; revierte con `safetyPath` si falla */
  replaceWith(sourcePath, safetyPath) {
    const dbPath = this.database.filePath;
    this.database.close();
    try {
      fs.copyFileSync(sourcePath, dbPath);
      this.removeSideFiles(dbPath);
    } catch (err) {
      fs.copyFileSync(safetyPath, dbPath);
      this.database.open();
      throw err;
    }
    this.database.open(); // reabre y aplica migraciones si el respaldo es antiguo
  }

  /** Agrega los registros del respaldo que no existan todavía */
  mergeFrom(sourcePath) {
    const db = this.database.connection;
    db.prepare('ATTACH DATABASE ? AS src').run(sourcePath);
    try {
      db.transaction(() => {
        for (const table of BACKUP_TABLES) this.mergeTable(db, table);
      })();
    } finally {
      db.exec('DETACH DATABASE src');
    }
  }

  mergeTable(db, table) {
    const columnsOf = schema =>
      db.prepare(`SELECT name FROM pragma_table_info(?, '${schema}')`).all(table).map(r => r.name);

    const srcCols = columnsOf('src');
    if (!srcCols.length) return;
    const mainCols = new Set(columnsOf('main'));
    const cols = srcCols.filter(c => mainCols.has(c)).map(c => `"${c}"`).join(', ');
    db.exec(`INSERT OR IGNORE INTO main."${table}" (${cols}) SELECT ${cols} FROM src."${table}"`);
  }

  hasSqliteHeader(filePath) {
    const fd = fs.openSync(filePath, 'r');
    try {
      const header = Buffer.alloc(16);
      fs.readSync(fd, header, 0, 16, 0);
      return header.toString('latin1') === SQLITE_HEADER;
    } finally {
      fs.closeSync(fd);
    }
  }

  removeSideFiles(dbPath) {
    for (const suffix of SIDE_FILE_SUFFIXES) {
      if (fs.existsSync(dbPath + suffix)) fs.unlinkSync(dbPath + suffix);
    }
  }
}

module.exports = { BackupService };
