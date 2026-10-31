/** Acceso tolerante a fallos a Web Storage (modo privado, cuota, JSON inválido). */
export class SafeStorage {
  constructor(private readonly storage: () => Storage) {}

  getRaw(key: string): string | null {
    try { return this.storage().getItem(key); } catch { return null; }
  }

  setRaw(key: string, value: string): void {
    try { this.storage().setItem(key, value); } catch { /* ignorar */ }
  }

  getJson<T>(key: string): T | null {
    try {
      const raw = this.getRaw(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  }

  setJson(key: string, value: unknown): void {
    if (value === null || value === undefined) this.remove(key);
    else this.setRaw(key, JSON.stringify(value));
  }

  remove(key: string): void {
    try { this.storage().removeItem(key); } catch { /* ignorar */ }
  }
}

export const local = new SafeStorage(() => localStorage);
export const session = new SafeStorage(() => sessionStorage);
