const crypto = require('crypto');
const { DEFAULT_SSH_PORT } = require('../config');
const { assert } = require('../utils/validators');

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
    return {
      name: conn.name,
      host: conn.host,
      port: conn.port || DEFAULT_SSH_PORT,
      username: conn.username,
      auth_type: conn.auth_type,
      password: conn.password || null,
      key_path: conn.key_path || null,
    };
  }
}

module.exports = { ConnectionService };
