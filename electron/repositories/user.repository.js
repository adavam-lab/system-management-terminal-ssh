/** Acceso a datos de usuarios (solo SQL, sin reglas de negocio). */
class UserRepository {
  constructor(database) {
    this.database = database;
  }

  get db() { return this.database.connection; }

  count() {
    return this.db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  }

  exists(id) {
    return !!this.db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  }

  findByUsername(username) {
    return this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  findByUsernameOrEmail(username, email) {
    return this.db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  }

  create(user) {
    this.db.prepare(`
      INSERT INTO users (id, username, name, lastname, email, password, recovery_pin)
      VALUES (@id, @username, @name, @lastname, @email, @password, @recovery_pin)
    `).run(user);
  }

  updatePassword(id, passwordHash) {
    this.db.prepare('UPDATE users SET password = ? WHERE id = ?').run(passwordHash, id);
  }
}

module.exports = { UserRepository };
