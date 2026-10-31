const pty = require('node-pty');
const { DEFAULT_TERMINAL_SIZE } = require('../config');

const FINGERPRINT_PROMPT = 'are you sure you want to continue connecting';
const PASSWORD_PROMPTS = ['password:', 'contraseña:'];

/**
 * Gestiona los procesos SSH (pty). No conoce Electron: notifica a través de callbacks
 * (`onData`, `onExit`) inyectados, lo que permite reutilizarlo o probarlo aislado.
 */
class SshSessionService {
  constructor({ connectionService, onData, onExit }) {
    this.connectionService = connectionService;
    this.onData = onData;
    this.onExit = onExit;
    this.sessions = new Map();
  }

  start({ connectionId, cols = DEFAULT_TERMINAL_SIZE.cols, rows = DEFAULT_TERMINAL_SIZE.rows }) {
    const conn = this.connectionService.getById(connectionId);
    if (!conn) throw new Error('Conexión no encontrada');
    if (this.sessions.has(connectionId)) return true;

    // Lanzar ssh directamente (sin shell intermedio): al terminar la sesión
    // el proceso muere y onExit cierra la terminal en la UI.
    const proc = pty.spawn(this.sshBinary(), this.buildSshArgs(conn), {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env,
      useConpty: false,
    });
    this.sessions.set(connectionId, proc);

    const autoResponder = this.createAutoResponder(conn, proc);
    proc.onData(data => {
      this.onData(connectionId, data);
      autoResponder(data);
    });

    proc.onExit(({ exitCode }) => {
      // Si se cerró manualmente desde la UI ya no está registrada: no avisar
      if (this.sessions.get(connectionId) !== proc) return;
      this.sessions.delete(connectionId);
      this.onExit(connectionId, exitCode);
    });

    return true;
  }

  write(connectionId, data) {
    this.sessions.get(connectionId)?.write(data);
  }

  resize(connectionId, cols, rows) {
    try {
      this.sessions.get(connectionId)?.resize(cols, rows);
    } catch { /* el proceso pudo haber terminado */ }
  }

  close(connectionId) {
    const proc = this.sessions.get(connectionId);
    if (!proc) return true;
    this.sessions.delete(connectionId);
    try { proc.kill(); } catch { /* ya terminó */ }
    return true;
  }

  closeAll() {
    for (const id of [...this.sessions.keys()]) this.close(id);
    return true;
  }

  sshBinary() {
    return process.platform === 'win32' ? 'ssh.exe' : 'ssh';
  }

  buildSshArgs(conn) {
    const args = [];
    if (conn.auth_type === 'key' && conn.key_path) args.push('-i', conn.key_path);
    if (conn.port) args.push('-p', String(conn.port));
    args.push(`${conn.username}@${conn.host}`);
    return args;
  }

  /** Acepta el fingerprint del host e inyecta la contraseña una sola vez */
  createAutoResponder(conn, proc) {
    let fingerprintAccepted = false;
    let passwordSent = false;
    const shouldSendPassword = conn.auth_type === 'password' && !!conn.password;

    return data => {
      const output = data.toLowerCase();
      if (!fingerprintAccepted && output.includes(FINGERPRINT_PROMPT)) {
        proc.write('yes\r');
        fingerprintAccepted = true;
      }
      if (shouldSendPassword && !passwordSent && PASSWORD_PROMPTS.some(p => output.includes(p))) {
        proc.write(conn.password + '\r');
        passwordSent = true;
      }
    };
  }
}

module.exports = { SshSessionService };
