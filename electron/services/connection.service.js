const crypto = require('crypto');
const { DEFAULT_SSH_PORT, DEFAULT_VNC_PORT, CONNECTION_KINDS, REMOTE_OS } = require('../config');
const { assert } = require('../utils/validators');

/** IDs numéricos (123456789) o personalizados ("oficina-01") de RustDesk */
const RUSTDESK_ID_REGEX = /^[A-Za-z0-9_-]{3,64}$/;

class ConnectionService {
  constructor({ connectionRepository, groupingService }) {
    this.connections = connectionRepository;
    this.grouping = groupingService;
  }

  getAll() {
    return this.connections.findAll();
  }

  getById(id) {
    return this.connections.findById(id);
  }

  add(conn) {
    const id = crypto.randomUUID();
    const grouping = this.grouping.resolveGrouping(conn);
    this.connections.create({ ...this.normalize(conn), ...grouping, id });
    return { id, ...grouping };
  }

  update(conn) {
    assert(conn?.id, 'update-connection: id es requerido.');
    const grouping = this.grouping.resolveGrouping(conn);
    const changes = this.connections.update({ ...this.normalize(conn), ...grouping, id: conn.id });
    assert(changes > 0, `update-connection: no se encontró ningún registro con id="${conn.id}"`);
    return grouping;
  }

  delete(id) {
    this.connections.delete(id);
    return id;
  }

  /** Solo los campos persistibles, con valores por defecto */
  normalize(conn) {
    const kind = CONNECTION_KINDS.includes(conn.kind) ? conn.kind : 'ssh';
    if (kind === 'rustdesk') return this.normalizeRustDesk(conn);

    const isRemote = kind === 'remote';
    if (isRemote) assert(REMOTE_OS.includes(conn.remote_os), 'Selecciona el sistema operativo del equipo remoto.');
    return {
      name: conn.name,
      host: conn.host,
      port: conn.port || DEFAULT_SSH_PORT,
      username: conn.username,
      auth_type: conn.auth_type,
      password: conn.password || null,
      key_path: conn.key_path || null,
      kind,
      remote_os: isRemote ? conn.remote_os : null,
      vnc_port: isRemote ? Number(conn.vnc_port) || DEFAULT_VNC_PORT : DEFAULT_VNC_PORT,
      vnc_password: isRemote ? conn.vnc_password || null : null,
    };
  }

  /**
   * RustDesk no usa SSH: guardamos el ID de RustDesk en `host` y la contraseña permanente
   * en `password`, así no hace falta cambiar las columnas NOT NULL de la tabla.
   */
  normalizeRustDesk(conn) {
    const rustdeskId = String(conn.host ?? '').replace(/\s+/g, '');
    assert(RUSTDESK_ID_REGEX.test(rustdeskId), 'El ID de RustDesk debe tener de 3 a 64 caracteres: letras, números, "-" o "_" (ej. 123 456 789).');
    assert(!conn.remote_os || REMOTE_OS.includes(conn.remote_os), 'Sistema operativo no válido.');
    return {
      name: conn.name,
      host: rustdeskId,
      port: DEFAULT_SSH_PORT,
      username: '',
      auth_type: 'password',
      password: conn.password || null,
      key_path: null,
      kind: 'rustdesk',
      remote_os: conn.remote_os || null,
      vnc_port: DEFAULT_VNC_PORT,
      vnc_password: null,
    };
  }
}

module.exports = { ConnectionService };
