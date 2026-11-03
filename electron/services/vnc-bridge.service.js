const crypto = require('crypto');
const net = require('net');
const { WebSocketServer } = require('ws');

/**
 * Puente WebSocket ↔ TCP. noVNC (en el renderer) solo habla WebSocket y el servidor VNC habla TCP:
 * este servicio reenvía los bytes entre los dos.
 * Cada sesión tiene su propio puerto en 127.0.0.1 y un token aleatorio en la URL, para que
 * ningún otro programa del equipo pueda colarse en la sesión.
 */
class VncBridgeService {
  constructor() {
    this.bridges = new Map(); // connectionId → WebSocketServer
  }

  /** @returns {Promise<string>} URL ws:// que debe usar noVNC */
  open(connectionId, tcpPort) {
    this.close(connectionId);
    const token = crypto.randomBytes(24).toString('hex');

    return new Promise((resolve, reject) => {
      const wss = new WebSocketServer({
        host: '127.0.0.1',
        port: 0, // puerto libre
        verifyClient: ({ req }) => new URL(req.url, 'http://localhost').searchParams.get('token') === token,
        handleProtocols: protocols => (protocols.has('binary') ? 'binary' : false),
      });

      wss.on('connection', ws => this.pipe(ws, tcpPort));

      wss.once('listening', () => {
        this.bridges.set(connectionId, wss);
        resolve(`ws://127.0.0.1:${wss.address().port}/?token=${token}`);
      });
      wss.once('error', reject);
    });
  }

  close(connectionId) {
    const wss = this.bridges.get(connectionId);
    if (!wss) return true;
    this.bridges.delete(connectionId);
    for (const client of wss.clients) client.terminate();
    wss.close();
    return true;
  }

  closeAll() {
    for (const id of [...this.bridges.keys()]) this.close(id);
    return true;
  }

  /** Une un cliente WebSocket con un socket TCP nuevo hacia el túnel */
  pipe(ws, tcpPort) {
    const tcp = net.connect(tcpPort, '127.0.0.1');
    const end = () => {
      tcp.destroy();
      ws.terminate();
    };

    ws.on('message', data => {
      if (!tcp.destroyed) tcp.write(data);
    });
    tcp.on('data', chunk => {
      if (ws.readyState === ws.OPEN) ws.send(chunk);
    });
    ws.on('close', end);
    ws.on('error', end);
    tcp.on('close', end);
    tcp.on('error', end);
  }
}

module.exports = { VncBridgeService };
