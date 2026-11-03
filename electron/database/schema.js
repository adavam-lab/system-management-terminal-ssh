const SCHEMA = `
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT NOT NULL,
    auth_type TEXT NOT NULL,
    password TEXT,
    key_path TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name     TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email    TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    recovery_pin TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS catalogs (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name       TEXT NOT NULL
  );
`;

const MIGRATIONS = [
  `ALTER TABLE users ADD COLUMN recovery_pin TEXT;`,
  `ALTER TABLE connections ADD COLUMN project_id TEXT;`,
  `ALTER TABLE connections ADD COLUMN catalog_id TEXT;`,
  // Escritorio remoto
  `ALTER TABLE connections ADD COLUMN kind TEXT DEFAULT 'ssh';`,
  `ALTER TABLE connections ADD COLUMN remote_os TEXT;`,
  `ALTER TABLE connections ADD COLUMN vnc_port INTEGER DEFAULT 5900;`,
  `ALTER TABLE connections ADD COLUMN vnc_password TEXT;`,
];

module.exports = { SCHEMA, MIGRATIONS };
