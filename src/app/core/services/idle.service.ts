import { Injectable, OnDestroy, signal } from '@angular/core';

/** Minutos sin actividad antes de cerrar la app */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
/** Segundos de cuenta regresiva del aviso antes de cerrar */
const IDLE_WARNING_SECONDS = 60;
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart'] as const;
const CHECK_INTERVAL_MS = 1000;

/**
 * Detecta inactividad del usuario. Expone la cuenta regresiva como signal
 * (null = sin aviso) y ejecuta `onTimeout` al llegar a cero.
 */
@Injectable({ providedIn: 'root' })
export class IdleService implements OnDestroy {
  private readonly _countdown = signal<number | null>(null);
  readonly countdown = this._countdown.asReadonly();

  private lastActivity = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  private onTimeout: () => void = () => {};

  private readonly onActivity = () => {
    // Durante el aviso solo cuenta un clic/tecla explícito en "Seguir usando"
    if (this._countdown() === null) this.lastActivity = Date.now();
  };

  start(onTimeout: () => void): void {
    this.stop();
    this.onTimeout = onTimeout;
    this.lastActivity = Date.now();
    // Fase de captura: xterm detiene la propagación de algunas teclas
    IDLE_EVENTS.forEach(e => window.addEventListener(e, this.onActivity, { capture: true, passive: true }));
    this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
  }

  stop(): void {
    IDLE_EVENTS.forEach(e => window.removeEventListener(e, this.onActivity, { capture: true }));
    clearInterval(this.timer);
    this.timer = undefined;
  }

  stayActive(): void {
    this._countdown.set(null);
    this.lastActivity = Date.now();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private check(): void {
    const idleMs = Date.now() - this.lastActivity;
    const warnAt = IDLE_TIMEOUT_MS - IDLE_WARNING_SECONDS * 1000;
    if (idleMs < warnAt) return;

    const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - idleMs) / 1000));
    if (remaining === 0) {
      this.stop();
      this.onTimeout();
      return;
    }
    this._countdown.set(remaining);
  }
}
