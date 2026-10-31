import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';

@Injectable({ providedIn: 'root' })
export class AppLifecycleService {
  constructor(private ipc: IpcService) {}

  /** Cierra la aplicación por inactividad; fuera de Electron cierra la ventana */
  quitForInactivity(): void {
    this.ipc.invoke(IpcChannels.APP_QUIT_IDLE).catch(() => window.close());
  }
}
