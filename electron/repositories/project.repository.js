class ProjectRepository {
  constructor(database) {
    this.database = database;
  }

  get db() { return this.database.connection; }

  findAll() {
    return this.db.prepare('SELECT * FROM projects ORDER BY name COLLATE NOCASE').all();
  }

  exists(id) {
    return !!this.db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
  }

  create(id, name) {
    this.db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(id, name);
  }

  rename(id, name) {
    this.db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, id);
  }

  delete(id) {
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  }

  transaction(fn) {
    return this.db.transaction(fn)();
  }
}

module.exports = { ProjectRepository };
