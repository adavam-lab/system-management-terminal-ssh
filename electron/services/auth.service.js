const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../config');
const { assert, assertValidPin, assertValidPassword } = require('../utils/validators');

const INVALID_RECOVERY_MSG = 'Usuario o PIN incorrecto.';

class AuthService {
  constructor(userRepository) {
    this.users = userRepository;
  }

  hasUsers() {
    return this.users.count() > 0;
  }

  async login({ username, password }) {
    const user = this.users.findByUsername(username);
    assert(user, 'Usuario no encontrado.');
    assert(await bcrypt.compare(password, user.password), 'Contraseña incorrecta.');
    return this.toPublicUser(user);
  }

  async register({ username, name, lastname, email, password, recoveryPin }) {
    assert(!this.users.findByUsernameOrEmail(username, email), 'El usuario o email ya está registrado.');
    assertValidPin(recoveryPin);

    const user = {
      id: crypto.randomUUID(),
      username, name, lastname, email,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      recovery_pin: await bcrypt.hash(recoveryPin, BCRYPT_ROUNDS),
    };
    this.users.create(user);
    return this.toPublicUser(user);
  }

  async recoverPassword({ username, recoveryPin, newPassword }) {
    assert(username && recoveryPin && newPassword, 'Por favor completa todos los campos.');
    assertValidPin(recoveryPin);
    assertValidPassword(newPassword);

    const user = this.users.findByUsername(username);
    // Mensaje genérico para no revelar si el usuario existe
    assert(user?.recovery_pin, INVALID_RECOVERY_MSG);
    assert(await bcrypt.compare(recoveryPin, user.recovery_pin), INVALID_RECOVERY_MSG);

    this.users.updatePassword(user.id, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
    return true;
  }

  userExists(id) {
    return !!id && this.users.exists(id);
  }

  /** Nunca exponer hashes al renderer */
  toPublicUser({ password, recovery_pin, ...publicUser }) {
    return publicUser;
  }
}

module.exports = { AuthService };
