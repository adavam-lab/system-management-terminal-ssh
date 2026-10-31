import { Injectable } from '@angular/core';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SshService } from './ssh.service';

const TERMINAL_OPTIONS = {
  cursorBlink: true,
  scrollback: 10000,
  theme: { background: '#0d1117', foreground: '#c9d1d9' },
};

interface TerminalInstance {
  term: Terminal;
  fit: FitAddon;
  /** Libera listeners del DOM registrados fuera de xterm */
  cleanup: () => void;
}

/**
 * Crea y gestiona las instancias xterm (una por conexión).
 * Encapsula portapapeles, atajos y redimensionado: el componente solo pide abrir/cerrar.
 */
@Injectable({ providedIn: 'root' })
export class TerminalService {
  private readonly terminals = new Map<string, TerminalInstance>();

  constructor(private ssh: SshService) {}

  has(id: string): boolean {
    return this.terminals.has(id);
  }

  size(id: string): { cols: number; rows: number } {
    const term = this.terminals.get(id)?.term;
    return { cols: term?.cols ?? 80, rows: term?.rows ?? 30 };
  }

  /** Monta una terminal en el contenedor `term-<id>`; si aún no existe en el DOM no hace nada */
  open(id: string): boolean {
    const container = document.getElementById('term-' + id);
    if (!container) return false;

    const term = new Terminal(TERMINAL_OPTIONS);
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    term.onData(data => this.ssh.write(id, data));
    term.onResize(({ cols, rows }) => this.ssh.resize(id, cols, rows));
    this.bindClipboard(id, term);
    const cleanup = this.bindPasteOnRightClick(id, container);

    this.terminals.set(id, { term, fit, cleanup });
    term.focus();
    return true;
  }

  write(id: string, data: string): void {
    this.terminals.get(id)?.term.write(data);
  }

  fit(id: string | null): void {
    if (id) this.terminals.get(id)?.fit.fit();
  }

  focus(id: string): void {
    const t = this.terminals.get(id);
    t?.fit.fit();
    t?.term.focus();
  }

  dispose(id: string): void {
    const t = this.terminals.get(id);
    if (!t) return;
    t.cleanup();
    t.term.dispose();
    this.terminals.delete(id);
  }

  /** Copiar al seleccionar y atajos Ctrl+Shift+C / Ctrl+Shift+V */
  private bindClipboard(id: string, term: Terminal): void {
    term.onSelectionChange(() => {
      if (term.hasSelection()) this.copy(term.getSelection());
    });

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.type === 'keydown')) return true;
      const key = e.key.toLowerCase();
      if (key === 'c' && term.hasSelection()) {
        this.copy(term.getSelection());
        return false;
      }
      if (key === 'v') {
        this.paste(id);
        return false;
      }
      return true;
    });
  }

  private bindPasteOnRightClick(id: string, container: HTMLElement): () => void {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      this.paste(id);
    };
    container.addEventListener('contextmenu', onContextMenu);
    return () => container.removeEventListener('contextmenu', onContextMenu);
  }

  private copy(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  private async paste(id: string): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) this.ssh.write(id, text);
    } catch (err) {
      console.error('Error al pegar en la terminal:', err);
    }
  }
}
