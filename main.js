const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const Database = require('better-sqlite3');
const os = require('os');
const pty = require('node-pty');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

let win;
let db;

function createWindow() {
  const iconPath = path.join(__dirname, 'public', 'logo-single.png');

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this demo. For prod, use contextIsolation + preload.js
    }
  });

  win.setMenu(null);

  // Serve Angular from localhost in dev, or local files in prod
  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:4050');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/ssh-manager/browser/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  win.on('closed', () => {
    win = null;
  });
}

function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'ssh-manager.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 22,
      username TEXT NOT NULL,
      auth_type TEXT NOT NULL,
      password TEXT,
      key_path TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id       TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name     TEXT NOT NULL,
      lastname TEXT NOT NULL,
      email    TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      recovery_pin TEXT
    );
  `);

  // Simple migration to add column if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN recovery_pin TEXT;`);
  } catch (err) {
    // Column might already exist, ignore
  }
}

// --- IPC Handlers: Auth ---

ipcMain.handle('auth:has-users', () => {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return row.count > 0;
});

ipcMain.handle('auth:login', async (event, { username, password }) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) throw new Error('Usuario no encontrado.');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Contraseña incorrecta.');
  // Devolver usuario sin el hash de contraseña
  const { password: _pwd, ...safeUser } = user;
  return safeUser;
});

ipcMain.handle('auth:register', async (event, { username, name, lastname, email, password, recoveryPin }) => {
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) throw new Error('El usuario o email ya está registrado.');
  
  if (!recoveryPin || !/^\d{6}$/.test(recoveryPin)) {
    throw new Error('El PIN de recuperación debe tener exactamente 6 dígitos.');
  }

  const hash = await bcrypt.hash(password, 10);
  const pinHash = await bcrypt.hash(recoveryPin, 10);
  const id = crypto.randomUUID();
  
  db.prepare(`INSERT INTO users (id, username, name, lastname, email, password, recovery_pin) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, username, name, lastname, email, hash, pinHash);
    
  return { id, username, name, lastname, email };
});

// --- IPC Handlers for Database ---

ipcMain.handle('get-connections', () => {
  const stmt = db.prepare('SELECT * FROM connections');
  return stmt.all();
});

ipcMain.handle('add-connection', (event, conn) => {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO connections (id, name, host, port, username, auth_type, password, key_path)
    VALUES (@id, @name, @host, @port, @username, @auth_type, @password, @key_path)
  `);
  stmt.run({
    id,
    name: conn.name,
    host: conn.host,
    port: conn.port || 22,
    username: conn.username,
    auth_type: conn.auth_type,
    password: conn.password || null,
    key_path: conn.key_path || null
  });
  return id;
});

ipcMain.handle('delete-connection', (event, id) => {
  const stmt = db.prepare('DELETE FROM connections WHERE id = ?');
  stmt.run(id);
  return id;
});

ipcMain.handle('update-connection', (event, conn) => {
  if (!conn || !conn.id) {
    throw new Error('update-connection: id es requerido pero no fue recibido. conn=' + JSON.stringify(conn));
  }
  const stmt = db.prepare(`
    UPDATE connections 
    SET name = @name, host = @host, port = @port, username = @username, auth_type = @auth_type, password = @password, key_path = @key_path
    WHERE id = @id
  `);
  const result = stmt.run({
    id: conn.id,
    name: conn.name,
    host: conn.host,
    port: conn.port || 22,
    username: conn.username,
    auth_type: conn.auth_type,
    password: conn.password || null,
    key_path: conn.key_path || null
  });
  if (result.changes === 0) {
    throw new Error(`update-connection: no se encontró ningún registro con id="${conn.id}"`);
  }
  return conn.id;
});

// --- PTY Terminal Management ---
const ptyProcesses = {};

ipcMain.on('terminal.keystroke', (event, { id, key }) => {
  if (ptyProcesses[id]) {
    ptyProcesses[id].write(key);
  }
});

ipcMain.handle('close-ssh', (event, connectionId) => {
  if (ptyProcesses[connectionId]) {
    ptyProcesses[connectionId].kill();
    delete ptyProcesses[connectionId];
  }
  return true;
});

ipcMain.handle('start-ssh', async (event, { connectionId, cols = 80, rows = 30 }) => {
  const conn = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId);
  if (!conn) throw new Error('Conexión no encontrada');

  // If already active, do nothing
  if (ptyProcesses[connectionId]) {
    return true;
  }

  // Determine shell based on OS
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: cols,
    rows: rows,
    cwd: process.env.HOME || process.env.USERPROFILE,
    env: process.env,
    useConpty: false
  });
  
  ptyProcesses[connectionId] = ptyProcess;

  let passwordSent = false;
  let fingerprintAccepted = false;

  ptyProcess.onData((data) => {
    if (win) {
      win.webContents.send('terminal.incomingData', { id: connectionId, data });
    }
    
    const output = data.toLowerCase();
    
    // Aceptar automáticamente la advertencia de "unknown host" (fingerprint)
    if (!fingerprintAccepted && output.includes('are you sure you want to continue connecting')) {
      ptyProcess.write('yes\r');
      fingerprintAccepted = true;
    }

    // Inyectar automáticamente la contraseña cuando la pida
    if (conn.auth_type === 'password' && conn.password && !passwordSent) {
      if (output.includes('password:') || output.includes('contraseña:')) {
        ptyProcess.write(conn.password + '\r');
        passwordSent = true;
      }
    }
  });

  ptyProcess.onExit(() => {
    if (win) {
      win.webContents.send('terminal.exit', { id: connectionId });
    }
    delete ptyProcesses[connectionId];
  });

  // Automatically start ssh command
  const portArg = conn.port ? `-p ${conn.port}` : '';
  const identityArg = (conn.auth_type === 'key' && conn.key_path) ? `-i "${conn.key_path}"` : '';
  
  const sshCmd = `ssh ${identityArg} ${portArg} ${conn.username}@${conn.host}\r`;
  ptyProcess.write(sshCmd);

  return true;
});

app.on('ready', () => {
  initDb();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
