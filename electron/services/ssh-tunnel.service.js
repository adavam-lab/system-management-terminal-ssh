const net = require('net');
const pty = require('node-pty');
const config = require('../config');

const PORT_RETRY_MS = 300;

/**
 * Abre un túnel SSH por conexión: 127.0.0.1:<puerto libre> → equipo remoto 127.0.0.1:<vnc_port>.
 * Usa node-pty (igual que la terminal) para reutilizar el auto-responder de fingerprint y contraseña.
 * No conoce Electron: avisa por el callback `onExit` cuando el túnel se cae.
 */
class SshTunnelService {
  constructor({ connectionService, sshSessionService, onExit }) {
    this.connectionService = connectionService;
    this.ssh = sshSessionService; // reutilizamos sshBinary, buildSshArgs y createAutoResponder
    this.onExit = onExit;
    this.tunnels = new Map(); // connectionId → { proc, localPort }
  }

  /** @returns {Promise<number>} puerto local donde escucha el túnel */
  async open(connectionId) {
    const existing = this.tunnels.get(connectionId);
    if (existing) return existing.localPort;

    const conn = this.connectionService.getById(connectionId);
    if (!conn) throw new Error('Conexión no encontrada');

    const localPort = await getFreePort();
    const remotePort = conn.vnc_port || config.DEFAULT_VNC_PORT;
    const args = [
      '-N',                                              // sin shell: solo el túnel
      '-L', `127.0.0.1:${localPort}:127.0.0.1:${remotePort}`,
      '-o', 'ConnectTimeout=10',                         // host que no responde = error en 10 s
      '-o', 'ExitOnForwardFailure=yes',                  // si no se puede crear el túnel, ssh termina
      '-o', 'ServerAliveInterval=30',                    // detecta conexiones muertas
      '-o', 'ServerAliveCountMax=2',
      '-o', 'NumberOfPasswordPrompts=1',                 // contraseña errónea = falla rápido

      ...this.ssh.buildSshArgs(conn),                    // -i, -p y usuario@host (siempre al final)
    ];

    const proc = pty.spawn(this.ssh.sshBinary(), args, {
      name: 'xterm',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.env.USERPROFILE,
      env: process.env,
      useConpty: false,
    });
    const tunnel = { proc, localPort, output: '' };
    this.tunnels.set(connectionId, tunnel);

    const autoResponder = this.ssh.createAutoResponder(conn, proc);
    proc.onData(data => {
      tunnel.output = (tunnel.output + data).slice(-500); // últimas líneas, para el mensaje de error
      autoResponder(data);
    });
    proc.onExit(({ exitCode }) => {
      if (this.tunnels.get(connectionId) !== tunnel) return; // cerrado desde la UI
      this.tunnels.delete(connectionId);
      this.onExit(connectionId, exitCode);
    });

    try {
      await waitForPort(localPort, config.TUNNEL_READY_TIMEOUT_MS, () => this.tunnels.get(connectionId) === tunnel);
    } catch (err) {
      this.close(connectionId);
      throw new Error(describeFailure(err.message, tunnel.output));
    }
    return localPort;
  }

  close(connectionId) {
    const tunnel = this.tunnels.get(connectionId);
    if (!tunnel) return true;
    this.tunnels.delete(connectionId);
    try { tunnel.proc.kill(); } catch { /* ya terminó */ }
    return true;
  }

  closeAll() {
    for (const id of [...this.tunnels.keys()]) this.close(id);
    return true;
  }
}

/** Pide al sistema un puerto libre (puerto 0) y lo libera para que ssh lo use */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Reintenta conectar al puerto local hasta que ssh lo abra (lo abre solo tras autenticar) */
function waitForPort(port, timeoutMs, isAlive) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      if (!isAlive()) return reject(new Error('SSH terminó antes de abrir el túnel'));
      const sock = net.connect(port, '127.0.0.1');
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error('El túnel SSH no respondió a tiempo'));
        else setTimeout(attempt, PORT_RETRY_MS);
      });
    };
    attempt();
  });
}

/** Traduce la salida de ssh a un mensaje útil para el usuario */
function describeFailure(baseMessage, output) {
  const out = output.toLowerCase();
  if (out.includes('permission denied')) return 'SSH rechazó el usuario, la contraseña o la llave.';
  if (out.includes('port forwarding failed') || out.includes('administratively prohibited')) {
    return 'El equipo remoto no permite túneles: activa AllowTcpForwarding en sshd_config.';
  }
  if (out.includes('connection refused')) return 'El equipo remoto rechazó la conexión SSH (¿está activo el servicio SSH?).';
  if (out.includes('could not resolve')) return 'No se encontró el host. Revisa el nombre o la IP.';
  if (out.includes('timed out') || out.includes('no route') || baseMessage.includes('no respondió')) {
    return 'El equipo remoto no responde en el puerto SSH: revisa que esté encendido, la VPN/red, ' +
      'que el servicio SSH (en Windows: sshd) esté activo y que el firewall permita el puerto 22.';
  }
  return baseMessage;
}

module.exports = { SshTunnelService };
