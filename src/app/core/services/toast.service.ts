import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../models';

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 2500;

/** Notificaciones efímeras. Usa signals: la vista se actualiza sola (app sin zone.js). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  show(message: string, type: ToastType = 'success', duration = DEFAULT_DURATION): void {
    const id = ++this.nextId;
    this._toasts.update(list => [...list, { id, message, type }].slice(-MAX_VISIBLE));
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, duration?: number) { this.show(message, 'success', duration); }
  error(message: string, duration?: number) { this.show(message, 'error', duration); }
  info(message: string, duration?: number) { this.show(message, 'info', duration); }

  dismiss(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}
