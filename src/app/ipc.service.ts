import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IpcService {
  private ipcRenderer: any;

  constructor(private zone: NgZone) {
    if (this.isElectron) {
      this.ipcRenderer = (window as any).require('electron').ipcRenderer;
    }
  }

  get isElectron(): boolean {
    return !!(window && window.navigator && window.navigator.userAgent.toLowerCase().includes('electron'));
  }

  public invoke(channel: string, ...args: any[]): Promise<any> {
    if (!this.ipcRenderer) {
      return Promise.reject('Not running in Electron');
    }
    return this.ipcRenderer.invoke(channel, ...args).then((result: any) => {
      return new Promise((resolve) => {
        this.zone.run(() => resolve(result));
      });
    });
  }

  public send(channel: string, ...args: any[]): void {
    if (!this.ipcRenderer) {
      return;
    }
    this.ipcRenderer.send(channel, ...args);
  }

  public on(channel: string): Observable<any> {
    return new Observable(observer => {
      if (!this.ipcRenderer) {
        observer.error('Not running in Electron');
        return;
      }
      const listener = (event: any, ...args: any[]) => {
        this.zone.run(() => {
          // Si solo hay un argumento, emítelo directamente; si no, emite el array
          observer.next(args.length === 1 ? args[0] : args);
        });
      };
      this.ipcRenderer.on(channel, listener);
      return () => {
        this.ipcRenderer.removeListener(channel, listener);
      };
    });
  }
}
