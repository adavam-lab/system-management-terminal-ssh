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

  // Escritorio remoto (VNC por túnel SSH)
  DEFAULT_VNC_PORT: 5900,
  TUNNEL_READY_TIMEOUT_MS: 15000,
  CONNECTION_KINDS: ['ssh', 'remote', 'rustdesk'],
  REMOTE_OS: ['windows', 'mac', 'linux'],

  // RustDesk: dónde buscar el cliente instalado en ESTE equipo
  RUSTDESK_EXECUTABLES: {
    darwin: ['/Applications/RustDesk.app/Contents/MacOS/RustDesk'],
    win32: [
      'C:\\Program Files\\RustDesk\\rustdesk.exe',
      'C:\\Program Files (x86)\\RustDesk\\rustdesk.exe',
    ],
    linux: ['/usr/bin/rustdesk', '/usr/local/bin/rustdesk', '/usr/share/rustdesk/rustdesk'],
  },
  // RustDesk2.toml del cliente local, relativo a la carpeta de usuario
  RUSTDESK_CONFIG_FILES: {
    darwin: 'Library/Preferences/com.carriez.RustDesk/RustDesk2.toml',
    win32: 'AppData/Roaming/RustDesk/config/RustDesk2.toml',
    linux: '.config/rustdesk/RustDesk2.toml',
  },
  RUSTDESK_DOWNLOAD_URL: 'https://github.com/rustdesk/rustdesk/releases/latest',
});
