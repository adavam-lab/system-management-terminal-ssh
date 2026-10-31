import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';
import { BackupResult, RestoreResult } from '../models';

@Injectable({ providedIn: 'root' })
export class BackupService {
  constructor(private ipc: IpcService) {}

  export(): Promise<BackupResult> {
    return this.ipc.invoke<BackupResult>(IpcChannels.DB_BACKUP);
  }

  restore(currentUserId?: string): Promise<RestoreResult> {
    return this.ipc.invoke<RestoreResult>(IpcChannels.DB_RESTORE, { currentUserId });
  }
}
