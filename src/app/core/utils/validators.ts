export const MIN_PASSWORD_LENGTH = 8;
const PIN_REGEX = /^\d{6}$/;

export const ValidationMessages = {
  REQUIRED: 'Por favor completa todos los campos.',
  PASSWORDS_MISMATCH: 'Las contraseñas no coinciden.',
  INVALID_PIN: 'El PIN de recuperación debe ser de 6 dígitos numéricos.',
  SHORT_PASSWORD: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
} as const;

export const isValidPin = (pin: string): boolean => PIN_REGEX.test(pin ?? '');
export const isValidPassword = (pwd: string): boolean => (pwd ?? '').length >= MIN_PASSWORD_LENGTH;
export const allFilled = (...values: string[]): boolean => values.every(v => !!v);

/** Una regla: si `failed` es verdadero, se devuelve `message`. */
export type Rule = [failed: boolean, message: string];

/** Devuelve el primer mensaje de error o `null` si todo es válido. */
export function firstError(rules: Rule[]): string | null {
  return rules.find(([failed]) => failed)?.[1] ?? null;
}
