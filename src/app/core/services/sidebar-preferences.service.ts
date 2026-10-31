import { Injectable } from '@angular/core';
import { local } from '../utils/storage';

const COLLAPSED_KEY = 'sshm.sidebarCollapsed';
const WIDTH_KEY = 'sshm.sidebarWidth';
const EXPANDED_KEY = 'sshm.sidebarExpanded';

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
const SIDEBAR_DEFAULT_WIDTH = 280;

/** Preferencias persistentes del panel lateral: colapsado, ancho y nodos expandidos. */
@Injectable({ providedIn: 'root' })
export class SidebarPreferencesService {
  collapsed = local.getRaw(COLLAPSED_KEY) === '1';
  width = this.clampWidth(Number(local.getRaw(WIDTH_KEY)) || SIDEBAR_DEFAULT_WIDTH);
  private readonly expanded = new Set<string>(local.getJson<string[]>(EXPANDED_KEY) ?? []);

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    local.setRaw(COLLAPSED_KEY, this.collapsed ? '1' : '0');
  }

  setWidth(width: number): void {
    this.width = this.clampWidth(width);
  }

  saveWidth(): void {
    local.setRaw(WIDTH_KEY, String(this.width));
  }

  isExpanded(id: string): boolean {
    return this.expanded.has(id);
  }

  toggle(id: string): void {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
    this.saveExpanded();
  }

  expand(...ids: (string | null | undefined)[]): void {
    ids.forEach(id => id && this.expanded.add(id));
    this.saveExpanded();
  }

  private saveExpanded(): void {
    local.setJson(EXPANDED_KEY, [...this.expanded]);
  }

  private clampWidth(w: number): number {
    return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, w));
  }
}
