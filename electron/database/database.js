const Database = require('better-sqlite3');
const { SCHEMA, MIGRATIONS } = require('./schema');

/**
 * Responsable único de abrir/cerrar la base SQLite y aplicar el esquema.
 * Los repositorios piden la conexión vía `connection` para soportar reaperturas (restore).
 */
class DatabaseManager {
  constructor(filePath) {
    this.filePath = filePath;
    this.db = null;
  }

  open() {
    this.db = new Database(this.filePath);
    this.db.exec(SCHEMA);
    this.applyMigrations();
    return this.db;
  }

  close() {
    this.db?.close();
    this.db = null;
  }

  get connection() {
    if (!this.db) throw new Error('La base de datos no está abierta.');
    return this.db;
  }

  /** Migraciones simples: agregar columnas si no existen */
  applyMigrations() {
    for (const sql of MIGRATIONS) {
      try {
        this.db.exec(sql);
      } catch {
        // La columna ya existe, ignorar
      }
    }
  }
}

module.exports = { DatabaseManager };
