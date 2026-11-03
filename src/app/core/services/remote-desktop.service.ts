import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';

export interface RemoteSession {
  /** URL ws://127.0.0.1:<puerto>/?token=… del puente en el proceso main */
  wsUrl: string;
  credentials: { username: string; password: string };
}
export interface RemoteExit { id: string; exitCode: number; }

/** Canal de comunicación con los túneles de escritorio remoto del proceso principal */
@Injectable({ providedIn: 'root' })
export class RemoteDesktopService {
  readonly exit$: Observable<RemoteExit>;

  constructor(private ipc: IpcService) {
    this.exit$ = ipc.on<RemoteExit>(IpcChannels.REMOTE_EXIT);
  }

  start(connectionId: string): Promise<RemoteSession> {
    return this.ipc.invoke<RemoteSession>(IpcChannels.REMOTE_START, connectionId);
  }

  stop(connectionId: string): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.REMOTE_STOP, connectionId);
  }

  stopAll(): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.REMOTE_STOP_ALL);
  }
}
