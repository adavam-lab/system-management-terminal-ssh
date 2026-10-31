import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';
import { Connection, Grouping } from '../models';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  constructor(private ipc: IpcService) {}

  getAll(): Promise<Connection[]> {
    return this.ipc.invoke<Connection[]>(IpcChannels.GET_CONNECTIONS);
  }

  add(conn: Connection): Promise<Grouping & { id: string }> {
    return this.ipc.invoke(IpcChannels.ADD_CONNECTION, conn);
  }

  update(conn: Connection): Promise<Grouping> {
    return this.ipc.invoke<Grouping>(IpcChannels.UPDATE_CONNECTION, conn);
  }

  delete(id: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.DELETE_CONNECTION, id);
  }
}
