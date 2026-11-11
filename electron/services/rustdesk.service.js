const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

const CUSTOM_SERVER_REGEX = /^\s*custom-rendezvous-server\s*=\s*['"]([^'"]*)['"]/m;

/**
 * Abre conexiones con el cliente RustDesk instalado en ESTE equipo
 * (`rustdesk --connect <ID> --password <clave>`).
 * RustDesk hace el resto: atraviesa NAT, cifra y usa el servidor relay si hace falta.
 */
class RustDeskService {
  constructor({ connectionService, platform = process.platform, homeDir = os.homedir() }) {
    this.connectionService = connectionService;
    this.platform = platform;
    this.homeDir = homeDir;
  }

  /** Estado del cliente local, para mostrarlo en el formulario */
  status() {
    const executable = this.findExecutable();
    return {
      installed: !!executable,
      executable,
      server: this.readCustomServer(), // null = servidores públicos de RustDesk
      downloadUrl: config.RUSTDESK_DOWNLOAD_URL,
    };
  }

  /** Abre la ventana de RustDesk conectada al ID guardado en la conexión */
  launch(connectionId) {
    const conn = this.connectionService.getById(connectionId);
    if (!conn) throw new Error('Conexión no encontrada');
    if (conn.kind !== 'rustdesk') throw new Error('La conexión no es de tipo RustDesk');

    const executable = this.findExecutable();
    if (!executable) {
      throw new Error(`RustDesk no está instalado en este equipo. Descárgalo de ${config.RUSTDESK_DOWNLOAD_URL}`);
    }

    const args = ['--connect', conn.host];
    if (conn.password) args.push('--password', conn.password);

    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { detached: true, stdio: 'ignore' });
      child.once('error', err => reject(new Error(`No se pudo abrir RustDesk: ${err.message}`)));
      child.once('spawn', () => {
        child.unref(); // RustDesk sigue abierto aunque se cierre XSSH Manager
        resolve(true);
      });
    });
  }

  findExecutable() {
    const candidates = config.RUSTDESK_EXECUTABLES[this.platform] ?? [];
    return candidates.find(file => fs.existsSync(file)) ?? null;
  }

  /** Lee `custom-rendezvous-server` del RustDesk2.toml del cliente local */
  readCustomServer() {
    const relative = config.RUSTDESK_CONFIG_FILES[this.platform];
    if (!relative) return null;
    try {
      const toml = fs.readFileSync(path.join(this.homeDir, relative), 'utf8');
      return toml.match(CUSTOM_SERVER_REGEX)?.[1] || null;
    } catch {
      return null; // RustDesk nunca se abrió o no hay permisos
    }
  }
}

module.exports = { RustDeskService };
