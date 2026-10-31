class CatalogRepository {
  constructor(database) {
    this.database = database;
  }

  get db() { return this.database.connection; }

  findAll() {
    return this.db.prepare('SELECT * FROM catalogs ORDER BY name COLLATE NOCASE').all();
  }

  findById(id) {
    return this.db.prepare('SELECT * FROM catalogs WHERE id = ?').get(id);
  }

  create(id, projectId, name) {
    this.db.prepare('INSERT INTO catalogs (id, project_id, name) VALUES (?, ?, ?)').run(id, projectId, name);
  }

  update(id, name, projectId) {
    this.db.prepare('UPDATE catalogs SET name = ?, project_id = ? WHERE id = ?').run(name, projectId, id);
  }

  delete(id) {
    this.db.prepare('DELETE FROM catalogs WHERE id = ?').run(id);
  }

  deleteByProject(projectId) {
    this.db.prepare('DELETE FROM catalogs WHERE project_id = ?').run(projectId);
  }
}

module.exports = { CatalogRepository };
