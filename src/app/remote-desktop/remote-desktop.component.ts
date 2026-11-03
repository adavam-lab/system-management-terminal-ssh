import {
  AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy,
  effect, inject, input, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import RFB from '@novnc/novnc';
import { RemoteOs } from '../core/models';
import { RemoteDesktopService } from '../core/services/remote-desktop.service';
import { ipcErrorMessage } from '../core/utils/ipc-error';

type RemoteStatus = 'connecting' | 'connected' | 'needs-password' | 'disconnected' | 'error';

/**
 * Muestra la pantalla de un equipo remoto (VNC por túnel SSH) y le envía mouse y teclado.
 * El túnel y el puente WebSocket viven en el proceso main; aquí solo está noVNC.
 */
@Component({
  selector: 'app-remote-desktop',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rd-toolbar">
      <span class="rd-status" [class]="'rd-status rd-' + status()">
        <span class="rd-dot"></span>{{ message() }}
      </span>
      <div class="rd-actions">
        @if (status() === 'connected') {
          @if (os() !== 'mac') {
            <button type="button" (click)="sendCtrlAltDel()" title="Enviar Ctrl+Alt+Supr">Ctrl+Alt+Supr</button>
          }
          <button type="button" (click)="pasteClipboard()" title="Enviar el portapapeles de este equipo al remoto">
            Pegar texto
          </button>
          <button type="button" (click)="toggleViewOnly()" [class.on]="viewOnly()"
            [title]="viewOnly() ? 'Volver a controlar el equipo' : 'Solo mirar, sin enviar mouse ni teclado'">
            {{ viewOnly() ? 'Solo ver: sí' : 'Solo ver: no' }}
          </button>
        }
        @if (status() === 'disconnected' || status() === 'error') {
          <button type="button" (click)="reconnect()">Reconectar</button>
        }
      </div>
    </div>

    <div class="rd-stage">
      <div #screen class="rd-screen"></div>

      @if (status() === 'needs-password') {
        <form class="rd-overlay" (ngSubmit)="submitPassword()">
          <p>El equipo remoto pide la contraseña VNC.</p>
          <input type="password" [(ngModel)]="passwordInput" name="vncPassword" placeholder="Contraseña VNC" autofocus>
          <button type="submit">Conectar</button>
        </form>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%; }
    .rd-toolbar {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
      padding: 6px 12px; background: #161b22; border-bottom: 1px solid #30363d; font-size: 13px;
    }
    .rd-status { display: inline-flex; align-items: center; gap: 8px; color: #8b949e; }
    .rd-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b949e; }
    .rd-connected .rd-dot { background: #3fb950; }
    .rd-connecting .rd-dot, .rd-needs-password .rd-dot { background: #d29922; }
    .rd-error .rd-dot, .rd-disconnected .rd-dot { background: #f85149; }
    .rd-error { color: #f85149; }
    .rd-actions { display: flex; gap: 6px; }
    .rd-actions button, .rd-overlay button {
      background: #21262d; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px;
      padding: 4px 10px; font-size: 12px; cursor: pointer;
    }
    .rd-actions button:hover, .rd-overlay button:hover { border-color: #58a6ff; color: #58a6ff; }
    .rd-actions button.on { border-color: #d29922; color: #d29922; }
    .rd-stage { position: relative; flex: 1; min-height: 0; background: #000; }
    .rd-screen { position: absolute; inset: 0; overflow: hidden; }
    .rd-overlay {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      display: flex; flex-direction: column; gap: 10px; min-width: 260px;
      padding: 20px; background: #161b22; border: 1px solid #30363d; border-radius: 10px; color: #c9d1d9;
    }
    .rd-overlay p { margin: 0; font-size: 13px; }
    .rd-overlay input {
      background: #0d1117; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 8px;
    }
  `],
})
export class RemoteDesktopComponent implements AfterViewInit, OnDestroy {
  readonly connectionId = input.required<string>();
  readonly os = input<RemoteOs | null | undefined>('windows');
  /** true cuando esta pestaña es la visible: recibe el foco del teclado */
  readonly active = input(false);

  readonly status = signal<RemoteStatus>('connecting');
  readonly message = signal('Abriendo túnel SSH…');
  readonly viewOnly = signal(false);
  passwordInput = '';

  private readonly screen = viewChild.required<ElementRef<HTMLDivElement>>('screen');
  private readonly remote = inject(RemoteDesktopService);
  private rfb: RFB | null = null;
  private destroyed = false;

  constructor() {
    // Si el túnel SSH se cae (red, reinicio del remoto…), lo mostramos
    this.remote.exit$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(({ id }) => {
      if (id !== this.connectionId() || this.status() === 'error') return;
      this.setStatus('disconnected', 'El túnel SSH se cerró');
    });

    effect(() => {
      if (this.active() && this.status() === 'connected') this.rfb?.focus();
    });
  }

  ngAfterViewInit(): void {
    this.start();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardown();
  }

  sendCtrlAltDel(): void {
    this.rfb?.sendCtrlAltDel();
    this.rfb?.focus();
  }

  async pasteClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) this.rfb?.clipboardPasteFrom(text);
    } catch { /* sin permiso de portapapeles */ }
    this.rfb?.focus();
  }

  toggleViewOnly(): void {
    this.viewOnly.update(v => !v);
    if (this.rfb) this.rfb.viewOnly = this.viewOnly();
  }

  submitPassword(): void {
    if (!this.rfb || !this.passwordInput) return;
    this.rfb.sendCredentials({ password: this.passwordInput });
    this.passwordInput = '';
    this.setStatus('connecting', 'Verificando contraseña…');
  }

  reconnect(): void {
    this.teardown();
    this.start();
  }

  private async start(): Promise<void> {
    const id = this.connectionId();
    this.setStatus('connecting', 'Abriendo túnel SSH…');
    try {
      const { wsUrl, credentials } = await this.remote.start(id);
      if (this.destroyed) {
        this.remote.stop(id).catch(() => {});
        return;
      }
      this.setStatus('connecting', 'Conectando al escritorio…');
      this.rfb = this.createRfb(wsUrl, credentials);
    } catch (err) {
      this.setStatus('error', ipcErrorMessage(err, 'No se pudo abrir el escritorio remoto'));
    }
  }

  private createRfb(wsUrl: string, credentials: { username: string; password: string }): RFB {
    const rfb = new RFB(this.screen().nativeElement, wsUrl, {
      wsProtocols: ['binary'],
      shared: true, // no expulsar a quien esté usando el equipo
      credentials: credentials.password ? credentials : undefined,
    });
    rfb.scaleViewport = true;  // ajusta la pantalla remota al tamaño de la pestaña
    rfb.resizeSession = false; // no cambia la resolución del equipo remoto
    rfb.viewOnly = this.viewOnly();

    rfb.addEventListener('connect', () => {
      this.setStatus('connected', 'Conectado');
      if (this.active()) rfb.focus();
    });
    rfb.addEventListener('disconnect', (e: any) => {
      if (this.rfb !== rfb || this.status() === 'error') return;
      this.setStatus(e.detail?.clean ? 'disconnected' : 'error',
        e.detail?.clean ? 'Desconectado' : 'Se perdió la conexión con el servidor VNC (¿está encendido?)');
    });
    rfb.addEventListener('credentialsrequired', () =>
      this.setStatus('needs-password', 'Falta la contraseña VNC'));
    rfb.addEventListener('securityfailure', (e: any) =>
      this.setStatus('error', 'Contraseña VNC rechazada' + (e.detail?.reason ? `: ${e.detail.reason}` : '')));
    // Texto copiado en el equipo remoto → portapapeles local
    rfb.addEventListener('clipboard', (e: any) => {
      if (e.detail?.text) navigator.clipboard.writeText(e.detail.text).catch(() => {});
    });
    return rfb;
  }

  private teardown(): void {
    const rfb = this.rfb;
    this.rfb = null;
    try { rfb?.disconnect(); } catch { /* ya desconectado */ }
    this.remote.stop(this.connectionId()).catch(() => {});
  }

  private setStatus(status: RemoteStatus, message: string): void {
    this.status.set(status);
    this.message.set(message);
  }
}
