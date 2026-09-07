import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IpcService } from './ipc.service';
import { LoginComponent } from './login/login';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export interface Connection {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_type: string;
  password?: string;
  key_path?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  isLoggedIn = false;
  currentUser: any = null;
  connections: Connection[] = [];
  activeConnectionId: string | null = null;
  showForm = false;
  isEditing = false;
  showProfileModal = false;
  
  newConnection: Connection = {
    name: '',
    host: '',
    port: 22,
    username: '',
    auth_type: 'password'
  };

  // Toast notifications
  toasts: { id: number; message: string; type: 'success' | 'error' | 'info' }[] = [];
  private toastId = 0;

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    const id = ++this.toastId;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, duration);
  }

  activeTerminals: { [id: string]: { term: Terminal, fit: FitAddon } } = {};
  activeSessions: string[] = [];

  constructor(private ipc: IpcService) {}

  onLogin(user: any) {
    this.isLoggedIn = true;
    this.currentUser = user;
    this.loadConnections();
    this.showToast(`Bienvenido, ${user.name}!`, 'success');
  }

  logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.connections = [];
    if (this.activeConnectionId) {
      this.disconnect(this.activeConnectionId);
    }
    this.activeSessions.forEach(id => this.disconnect(id));
    this.activeSessions = [];
    this.activeConnectionId = null;
  }

  ngOnInit(): void {
    this.loadConnections();
    
    // Escuchar datos entrantes de SSH
    this.ipc.on('terminal.incomingData').subscribe(payload => {
      const { id, data } = payload;
      if (this.activeTerminals[id]) {
        this.activeTerminals[id].term.write(data);
      }
    });

    // Detectar cuando el proceso de terminal muere / se cierra
    this.ipc.on('terminal.exit').subscribe(payload => {
      const { id } = payload;
      const name = this.getActiveConnectionName(id);
      this.showToast(`Conexión SSH terminada: ${name || id}`, 'info');
      this.disconnect(id, true);
    });
  }

  ngAfterViewInit(): void {
    // Inicializar terminal (oculta hasta que haya conexión activa)
  }

  async loadConnections() {
    try {
      this.connections = await this.ipc.invoke('get-connections');
    } catch (err) {
      console.error('Error loading connections:', err);
    }
  }

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.newConnection = {
      name: '',
      host: '',
      port: 22,
      username: '',
      auth_type: 'password'
    };
  }

  editConnection(conn: Connection, event?: Event) {
    if (event) event.stopPropagation();
    this.isEditing = true;
    this.showForm = true;
    // Clonamos el objeto para no modificar la vista hasta guardar
    this.newConnection = { ...conn };
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
  }

  goToDashboard() {
    this.activeConnectionId = null;
    this.showForm = false;
  }

  isSaving = false;

  async saveConnection() {
    if (this.isSaving) return;
    this.isSaving = true;
    console.log('[saveConnection] isEditing:', this.isEditing, '| id:', this.newConnection.id);
    try {
      if (this.isEditing && this.newConnection.id) {
        await this.ipc.invoke('update-connection', this.newConnection);
        const idx = this.connections.findIndex(c => c.id === this.newConnection.id);
        if (idx !== -1) {
          this.connections[idx] = { ...this.newConnection };
          this.connections = [...this.connections];
        }
        this.showToast('Conexión actualizada correctamente', 'success');
      } else {
        const newId = await this.ipc.invoke('add-connection', this.newConnection);
        this.connections = [...this.connections, { ...this.newConnection, id: newId }];
        this.showToast('Conexión creada correctamente', 'success');
      }
      this.showForm = false;
      this.isEditing = false;
    } catch (err) {
      console.error('Error saving connection:', err);
      this.showToast('Error al guardar la conexión', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async deleteConnection(id: string) {
    if (confirm('¿Eliminar esta conexión de forma permanente?')) {
      try {
        await this.ipc.invoke('delete-connection', id);
        if (this.activeConnectionId === id) {
          this.disconnect();
        }
        this.connections = this.connections.filter(c => c.id !== id);
        this.showToast('Conexión eliminada', 'info');
      } catch(err) {
        console.error('Error:', err);
        this.showToast('Error al eliminar la conexión', 'error');
      }
    }
  }

  async connect(conn: Connection, event?: Event) {
    if (event) event.stopPropagation();
    if (!conn.id) return;
    
    this.showForm = false;
    this.activeConnectionId = conn.id;
    const currentId = conn.id;

    if (this.activeSessions.includes(currentId)) {
      // Ya está abierta, solo cambiamos a ella y ajustamos tamaño
      setTimeout(() => {
        if (this.activeTerminals[currentId]) {
          this.activeTerminals[currentId].fit.fit();
          this.activeTerminals[currentId].term.focus();
        }
      }, 50);
      return;
    }

    this.activeSessions.push(conn.id);
    this.showToast(`Conectando a ${conn.name}...`, 'info', 2000);
    this.setupTerminal(conn.id);
    try {
      await this.ipc.invoke('start-ssh', conn.id);
      this.showToast(`Conectado a ${conn.name}`, 'success');
    } catch (err) {
      console.error('Error connecting:', err);
      this.showToast(`No se pudo conectar a ${conn.name}`, 'error');
      this.disconnect(conn.id);
    }
  }

  disconnect(connectionId?: string, isFromBackend: boolean = false) {
    const idToClose = connectionId || this.activeConnectionId;
    if (!idToClose) return;

    const name = this.getActiveConnectionName(idToClose);
    
    // Matar el proceso en backend solo si la orden viene del frontend
    if (!isFromBackend) {
      this.ipc.invoke('close-ssh', idToClose).catch(() => {});
    }

    if (this.activeTerminals[idToClose]) {
      this.activeTerminals[idToClose].term.dispose();
      delete this.activeTerminals[idToClose];
    }
    
    this.activeSessions = this.activeSessions.filter(id => id !== idToClose);
    
    if (this.activeConnectionId === idToClose) {
      this.activeConnectionId = this.activeSessions.length > 0 ? this.activeSessions[this.activeSessions.length - 1] : null;
    }
    
    if (name) this.showToast(`Conexión cerrada: ${name}`, 'info');
  }

  private setupTerminal(connectionId: string) {
    setTimeout(() => {
      const container = document.getElementById('term-' + connectionId);
      if (!container) return;
      
      const terminal = new Terminal({
        cursorBlink: true,
        scrollback: 10000,
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9'
        }
      });
      
      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);
      
      terminal.open(container);
      fitAddon.fit();
      
      this.activeTerminals[connectionId] = { term: terminal, fit: fitAddon };

      terminal.onData(data => {
        this.ipc.send('terminal.keystroke', { id: connectionId, key: data });
      });

      // 1. Copiar automáticamente al seleccionar texto
      terminal.onSelectionChange(() => {
        if (terminal.hasSelection()) {
          navigator.clipboard.writeText(terminal.getSelection());
        }
      });

      // 2. Pegar con clic derecho
      container.addEventListener('contextmenu', async (e: MouseEvent) => {
        e.preventDefault();
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
             this.ipc.send('terminal.keystroke', { id: connectionId, key: text });
          }
        } catch (err) {
          console.error('Error pasting with right click:', err);
        }
      });

      // 3. Atajos de teclado: Ctrl+Shift+C (Copiar) y Ctrl+Shift+V (Pegar)
      terminal.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.type === 'keydown') {
          if (e.key.toLowerCase() === 'c' && terminal.hasSelection()) {
            navigator.clipboard.writeText(terminal.getSelection());
            return false;
          }
          if (e.key.toLowerCase() === 'v') {
            navigator.clipboard.readText().then(text => {
              if (text) this.ipc.send('terminal.keystroke', { id: connectionId, key: text });
            });
            return false;
          }
        }
        return true;
      });

      // Asegurarse de que el fit se redimensione con la ventana
      window.addEventListener('resize', () => {
        if (this.activeConnectionId === connectionId) {
          fitAddon.fit();
        }
      });
      
      terminal.focus();
    }, 100);
  }

  getActiveConnectionName(connectionId?: string): string {
    const id = connectionId || this.activeConnectionId;
    if (!id) return '';
    const conn = this.connections.find(c => c.id === id);
    return conn ? conn.name : '';
  }

  async copyPassword(conn: Connection, event?: Event) {
    if (event) event.stopPropagation();
    if (conn.password) {
      try {
        await navigator.clipboard.writeText(conn.password);
        this.showToast('Contraseña copiada al portapapeles', 'success');
      } catch (err) {
        this.showToast('Error al copiar la contraseña', 'error');
      }
    } else {
      this.showToast('Esta conexión no tiene contraseña o usa llave SSH', 'info');
    }
  }
}
