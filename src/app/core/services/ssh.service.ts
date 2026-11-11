import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';

export interface TerminalData { id: string; data: string; }
export interface TerminalExit { id: string; exitCode: number; }

/** Canal de comunicación con las sesiones SSH del proceso principal */
@Injectable({ providedIn: 'root' })
export class SshService {
  readonly incomingData$: Observable<TerminalData>;
  readonly exit$: Observable<TerminalExit>;

  constructor(private ipc: IpcService) {
    this.incomingData$ = ipc.on<TerminalData>(IpcChannels.TERMINAL_INCOMING_DATA);
    this.exit$ = ipc.on<TerminalExit>(IpcChannels.TERMINAL_EXIT);
  }

  /** `sessionId` identifica la terminal; `connectionId` el servidor (puede repetirse en varias terminales) */
  start(sessionId: string, connectionId: string, cols: number, rows: number): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.START_SSH, { sessionId, connectionId, cols, rows });
  }

  close(connectionId: string): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.CLOSE_SSH, connectionId);
  }

  closeAll(): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.CLOSE_ALL_SSH);
  }

  write(id: string, key: string): void {
    this.ipc.send(IpcChannels.TERMINAL_KEYSTROKE, { id, key });
  }

  resize(id: string, cols: number, rows: number): void {
    this.ipc.send(IpcChannels.TERMINAL_RESIZE, { id, cols, rows });
  }
}
