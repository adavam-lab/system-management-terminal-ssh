import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { IpcChannel } from './ipc-channels';

/**
 * Único punto de contacto con Electron. El resto de servicios dependen de esta
 * abstracción en lugar de `window.require('electron')`.
 */
@Injectable({ providedIn: 'root' })
export class IpcService {
  private readonly ipcRenderer: any = null;

  constructor(private zone: NgZone) {
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
    }
  }

  get isElectron(): boolean {
    return !!window?.navigator?.userAgent.toLowerCase().includes('electron');
  }

  invoke<T = unknown>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
    if (!this.ipcRenderer) return Promise.reject(new Error('Not running in Electron'));
    return this.ipcRenderer.invoke(channel, ...args).then(
      (result: T) => new Promise<T>(resolve => this.zone.run(() => resolve(result)))
    );
  }

  send(channel: IpcChannel, ...args: unknown[]): void {
    this.ipcRenderer?.send(channel, ...args);
  }

  on<T = any>(channel: IpcChannel): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.ipcRenderer) {
        observer.error('Not running in Electron');
        return;
      }
      const listener = (_event: unknown, ...args: any[]) => {
        // Si solo hay un argumento, emítelo directamente; si no, emite el array
        this.zone.run(() => observer.next((args.length === 1 ? args[0] : args) as T));
      };
      this.ipcRenderer.on(channel, listener);
      return () => this.ipcRenderer.removeListener(channel, listener);
    });
  }
}
