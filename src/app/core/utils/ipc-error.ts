const ELECTRON_PREFIX = /^Error invoking remote method '[^']+': (Error: )?/;

/** Convierte un error de IPC en un mensaje legible para el usuario. */
export function ipcErrorMessage(err: unknown, fallback = 'Error desconocido'): string {
  const raw = (err as any)?.message ?? err;
  const msg = raw ? String(raw) : fallback;
  if (msg.includes('No handler registered')) {
    return 'el proceso principal está desactualizado. Reinicia la app (npm start).';
  }
  // Electron antepone "Error invoking remote method '...': Error: "
  return msg.replace(ELECTRON_PREFIX, '') || fallback;
}
