const { MIN_PASSWORD_LENGTH } = require('../config');

const PIN_REGEX = /^\d{6}$/;

function isBlank(value) {
  return !value || !String(value).trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertValidPin(pin) {
  assert(pin && PIN_REGEX.test(pin), 'El PIN de recuperación debe tener exactamente 6 dígitos.');
}

function assertValidPassword(password) {
  assert(password && password.length >= MIN_PASSWORD_LENGTH,
    `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
}

module.exports = { isBlank, assert, assertValidPin, assertValidPassword };
