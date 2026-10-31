const path = require('path');

/** Configuración centralizada del proceso principal (sin valores mágicos repartidos). */
module.exports = Object.freeze({
  DEV_SERVER_URL: 'http://localhost:4050',
  PROD_INDEX_PATH: path.join(__dirname, '..', 'dist/ssh-manager/browser/index.html'),
  ICON_PATH: path.join(__dirname, '..', 'public', 'logo-single.png'),
  WINDOW_SIZE: { width: 1200, height: 800 },

  DB_FILE_NAME: 'ssh-manager.db',
  BACKUP_TABLES: ['users', 'projects', 'catalogs', 'connections'],
  BACKUP_EXTENSIONS: ['db', 'sqlite', 'sqlite3'],

  BCRYPT_ROUNDS: 10,
  MIN_PASSWORD_LENGTH: 8,
  DEFAULT_SSH_PORT: 22,
  DEFAULT_TERMINAL_SIZE: { cols: 80, rows: 30 },
});
