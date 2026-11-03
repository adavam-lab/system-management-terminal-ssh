class ConnectionRepository {
  constructor(database) {
    this.database = database;
  }

  get db() { return this.database.connection; }

  findAll() {
    return this.db.prepare('SELECT * FROM connections').all();
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM connections WHERE id = ?').get(id);
  }

  create(conn) {
    this.db.prepare(`
      INSERT INTO connections (id, name, host, port, username, auth_type, password, key_path, project_id, catalog_id,
                               kind, remote_os, vnc_port, vnc_password)
      VALUES (@id, @name, @host, @port, @username, @auth_type, @password, @key_path, @project_id, @catalog_id,
              @kind, @remote_os, @vnc_port, @vnc_password)
    `).run(conn);
  }

  /** @returns {number} filas modificadas */
  update(conn) {
    return this.db.prepare(`
      UPDATE connections
      SET name = @name, host = @host, port = @port, username = @username, auth_type = @auth_type,
          password = @password, key_path = @key_path, project_id = @project_id, catalog_id = @catalog_id,
          kind = @kind, remote_os = @remote_os, vnc_port = @vnc_port, vnc_password = @vnc_password
      WHERE id = @id
    `).run(conn).changes;
  }

  delete(id) {
    this.db.prepare('DELETE FROM connections WHERE id = ?').run(id);
  }

  ungroupByProject(projectId) {
    this.db.prepare('UPDATE connections SET project_id = NULL, catalog_id = NULL WHERE project_id = ?').run(projectId);
  }

  ungroupByCatalog(catalogId) {
    this.db.prepare('UPDATE connections SET catalog_id = NULL WHERE catalog_id = ?').run(catalogId);
  }

  moveCatalogToProject(catalogId, projectId) {
    this.db.prepare('UPDATE connections SET project_id = ? WHERE catalog_id = ?').run(projectId, catalogId);
  }
}

module.exports = { ConnectionRepository };
