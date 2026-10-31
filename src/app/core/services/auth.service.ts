import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';
import { User } from '../models';

export interface RegisterData {
  username: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  recoveryPin: string;
}

export interface RecoverData {
  username: string;
  recoveryPin: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private ipc: IpcService) {}

  hasUsers(): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.AUTH_HAS_USERS);
  }

  login(username: string, password: string): Promise<User> {
    return this.ipc.invoke<User>(IpcChannels.AUTH_LOGIN, { username, password });
  }

  register(data: RegisterData): Promise<User> {
    return this.ipc.invoke<User>(IpcChannels.AUTH_REGISTER, data);
  }

  recoverPassword(data: RecoverData): Promise<boolean> {
    return this.ipc.invoke<boolean>(IpcChannels.AUTH_RECOVER_PASSWORD, data);
  }
}
