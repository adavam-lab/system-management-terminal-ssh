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
  
  newConnection: Connection = {
    name: '',
    host: '',
    port: 22,
    username: '',
    auth_type: 'password'
  };

  terminal: Terminal | null = null;
  fitAddon: FitAddon | null = null;
  @ViewChild('terminalContainer') terminalContainer!: ElementRef;

  constructor(private ipc: IpcService) {}

  onLogin(user: any) {
    this.isLoggedIn = true;
    this.currentUser = user;
    this.loadConnections();
  }

  logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    this.connections = [];
    this.activeConnectionId = null;
    this.showForm = false;
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }

  ngOnInit(): void {
    this.loadConnections();
    
    // Escuchar datos entrantes de SSH
    this.ipc.on('terminal.incomingData').subscribe(data => {
      if (this.terminal) {
        this.terminal.write(data);
      }
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

  async saveConnection() {
    console.log('[saveConnection] isEditing:', this.isEditing, '| id:', this.newConnection.id, '| obj:', JSON.stringify(this.newConnection));
    try {
      if (this.isEditing && this.newConnection.id) {
        await this.ipc.invoke('update-connection', this.newConnection);
      } else {
        const newId = await this.ipc.invoke('add-connection', this.newConnection);
        this.newConnection.id = newId;
      }
      this.showForm = false;
      this.isEditing = false;
      await this.loadConnections();
    } catch (err) {
      console.error('Error saving connection:', err);
      alert('Error al guardar: ' + err);
    }
  }

  async deleteConnection(id: string) {
    if (confirm('¿Eliminar esta conexión de forma permanente?')) {
      try {
        await this.ipc.invoke('delete-connection', id);
        if (this.activeConnectionId === id) {
          this.disconnect();
        }
        await this.loadConnections();
      } catch(err) {
        console.error('Error:', err);
      }
    }
  }

  async connect(conn: Connection, event?: Event) {
    if (event) event.stopPropagation();
    if (!conn.id) return;
    this.activeConnectionId = conn.id;
    this.showForm = false;
    
    // Inicializar o reiniciar xterm
    this.setupTerminal();

    try {
      await this.ipc.invoke('start-ssh', conn.id);
    } catch (err) {
      console.error('Error connecting:', err);
      alert('No se pudo iniciar la conexión: ' + err);
      this.disconnect();
    }
  }

  disconnect() {
    this.activeConnectionId = null;
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }

  private setupTerminal() {
    if (this.terminal) {
      this.terminal.dispose();
    }
    
    setTimeout(() => {
      if (!this.terminalContainer) return;
      
      this.terminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9'
        }
      });
      
      this.fitAddon = new FitAddon();
      this.terminal.loadAddon(this.fitAddon);
      
      this.terminal.open(this.terminalContainer.nativeElement);
      this.fitAddon.fit();
      
      this.terminal.onData(data => {
        this.ipc.send('terminal.keystroke', data);
      });

      window.addEventListener('resize', () => {
        if (this.fitAddon) {
          this.fitAddon.fit();
        }
      });
    }, 100); // Darle tiempo a la vista para renderizar el div
  }

  getActiveConnectionName(): string {
    if (!this.activeConnectionId) return '';
    const conn = this.connections.find(c => c.id === this.activeConnectionId);
    return conn ? conn.name : '';
  }

  async copyPassword(conn: Connection, event?: Event) {
    if (event) event.stopPropagation();
    if (conn.password) {
      try {
        await navigator.clipboard.writeText(conn.password);
        alert('Clave copiada al portapapeles.');
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    } else {
      alert('Esta conexión no tiene contraseña o usa llave SSH.');
    }
  }
}
