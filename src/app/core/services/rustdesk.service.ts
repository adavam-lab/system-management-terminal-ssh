import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';

export interface RustDeskStatus {
  /** true si el cliente RustDesk está instalado en este equipo */
  installed: boolean;
  executable: string | null;
  /** Servidor propio configurado en el cliente; null = servidores públicos de RustDesk */
  server: string | null;
  downloadUrl: string;
}

/** Abre conexiones con el cliente RustDesk instalado en este equipo */
@Injectable({ providedIn: 'root' })
export class RustDeskService {
  constructor(private ipc: IpcService) {}

  status(): Promise<RustDeskStatus> {
    return this.ipc.invoke<RustDeskStatus>(IpcChannels.RUSTDESK_STATUS);
  }

  launch(connectionId: string): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.RUSTDESK_LAUNCH, connectionId);
  }
}
