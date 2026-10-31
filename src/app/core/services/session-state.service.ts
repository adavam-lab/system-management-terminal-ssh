import { Injectable } from '@angular/core';
import { DashboardScope, User } from '../models';
import { session } from '../utils/storage';

const USER_KEY = 'sshm.sessionUser';
const SCOPE_KEY = 'sshm.dashboardScope';

/** Estado de sesión que sobrevive al refresco de la ventana, no al cerrar la app. */
@Injectable({ providedIn: 'root' })
export class SessionStateService {
  get user(): User | null { return session.getJson<User>(USER_KEY); }
  set user(value: User | null) { session.setJson(USER_KEY, value); }

  get scope(): DashboardScope | null { return session.getJson<DashboardScope>(SCOPE_KEY); }
  set scope(value: DashboardScope | null) { session.setJson(SCOPE_KEY, value); }

  clear(): void {
    this.user = null;
    this.scope = null;
  }
}
