import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LoginComponent } from './login/login';
import { Catalog, Connection, DashboardScope, GroupForm, Project, Toast, User } from './core/models';
import { ConnectionTree } from './core/utils/connection-tree';
import { ipcErrorMessage } from './core/utils/ipc-error';
import { ConnectionService } from './core/services/connection.service';
import { GroupingService } from './core/services/grouping.service';
import { BackupService } from './core/services/backup.service';
import { SshService } from './core/services/ssh.service';
import { TerminalService } from './core/services/terminal.service';
import { ToastService } from './core/services/toast.service';
import { SessionStateService } from './core/services/session-state.service';
import { SidebarPreferencesService } from './core/services/sidebar-preferences.service';
import { IdleService } from './core/services/idle.service';
import { AppLifecycleService } from './core/services/app-lifecycle.service';

const COLLAPSED_SIDEBAR_WIDTH = 64;
const SIDEBAR_TRANSITION_MS = 220;
const TERMINAL_MOUNT_DELAY_MS = 100;
const TERMINAL_SWITCH_DELAY_MS = 50;
const CONNECTING_TOAST_MS = 2000;
const LONG_TOAST_MS = 3500;
const ERROR_TOAST_MS = 5000;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * ViewModel de la vista principal (app.html).
 * - Expone estado y comandos a la plantilla.
 * - No accede a IPC, storage ni xterm directamente: delega en los servicios de core/.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, LoginComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // ── Estado de sesión ──
  isLoggedIn = false;
  currentUser: User | null = null;

  // ── Datos ──
  connections: Connection[] = [];
  projects: Project[] = [];
  catalogs: Catalog[] = [];

  // ── Estado de la vista ──
  activeConnectionId: string | null = null;
  activeSessions: string[] = [];
  dashboardScope: DashboardScope = { type: 'all' };
  showForm = false;
  isEditing = false;
  showProfileModal = false;
  dbBusy = false;
  groupForm: GroupForm | null = null;
  newConnection: Connection = this.emptyConnection();

  private isSaving = false;
  private resizing = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private connectionService: ConnectionService,
    private groupingService: GroupingService,
    private backupService: BackupService,
    private ssh: SshService,
    private terminals: TerminalService,
    private toast: ToastService,
    private sessionState: SessionStateService,
    private sidebar: SidebarPreferencesService,
    private idle: IdleService,
    private lifecycle: AppLifecycleService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ───────────── Ciclo de vida ─────────────

  ngOnInit(): void {
    this.restoreSession();

    // Las terminales del renderer se pierden al refrescar: cerrar procesos SSH huérfanos
    this.ssh.closeAll().catch(() => {});

    this.idle.start(() => this.lifecycle.quitForInactivity());
    this.loadAll();

    this.subscriptions.add(
      this.ssh.incomingData$.subscribe(({ id, data }) => this.terminals.write(id, data))
    );
    this.subscriptions.add(
      this.ssh.exit$.subscribe(({ id }) => {
        if (!this.activeSessions.includes(id)) return; // ya se cerró desde la UI
        this.disconnect(id, true);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.idle.stop();
  }

  get toasts(): Toast[] {
    return this.toast.toasts();
  }

  // ───────────── Atajos globales / ventana ─────────────

  @HostListener('document:keydown.escape')
  onEscape() {
    this.showProfileModal = false;
    this.groupForm = null;
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.terminals.fit(this.activeConnectionId);
  }

  // ───────────── Cierre por inactividad ─────────────

  /** Segundos restantes del aviso (null = sin aviso) */
  get idleCountdown(): number | null {
    return this.idle.countdown();
  }

  stayActive() {
    this.idle.stayActive();
  }

  // ───────────── Sesión ─────────────

  onLogin(user: User) {
    this.isLoggedIn = true;
    this.currentUser = user;
    this.sessionState.user = user;
    this.loadAll();
    this.toast.success(`Bienvenido, ${user.name}!`);
  }

  logout() {
    this.sessionState.clear();
    [...this.activeSessions].forEach(id => this.disconnect(id));
    this.isLoggedIn = false;
    this.currentUser = null;
    this.connections = [];
    this.activeSessions = [];
    this.activeConnectionId = null;
  }

  getUserInitials(): string {
    const u = this.currentUser;
    if (!u) return 'U';
    const initials = `${u.name?.charAt(0) ?? ''}${u.lastname?.charAt(0) ?? ''}`.trim();
    return (initials || u.username?.charAt(0) || 'U').toUpperCase();
  }

  /** Restaurar sesión tras un refresco de la ventana */
  private restoreSession() {
    const savedUser = this.sessionState.user;
    if (!savedUser) return;
    this.isLoggedIn = true;
    this.currentUser = savedUser;
    this.dashboardScope = this.sessionState.scope ?? { type: 'all' };
  }

  // ───────────── Carga de datos ─────────────

  async loadAll() {
    try {
      const [connections, projects, catalogs] = await Promise.all([
        this.connectionService.getAll(),
        this.groupingService.getProjects(),
        this.groupingService.getCatalogs(),
      ]);
      this.connections = connections;
      this.projects = projects;
      this.catalogs = catalogs;
      if (ConnectionTree.isScopeStale(this.dashboardScope, projects, catalogs)) {
        this.showScope({ type: 'all' });
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    this.refreshView();
  }

  // ───────────── Backup / Restore ─────────────

  async backupDb() {
    await this.runDbTask(async () => {
      const res = await this.backupService.export();
      if (res?.ok) this.toast.success('Respaldo exportado correctamente', LONG_TOAST_MS);
    }, 'No se pudo exportar');
  }

  async restoreDb() {
    await this.runDbTask(async () => {
      const res = await this.backupService.restore(this.currentUser?.id);
      if (!res?.ok) return;

      // Las sesiones SSH ya se cerraron en el proceso principal
      [...this.activeSessions].forEach(id => this.disconnect(id, true));
      this.toast.success(
        res.mode === 'replace' ? 'Base de datos restaurada' : 'Respaldo combinado con la base actual',
        LONG_TOAST_MS
      );

      if (res.userStillExists) {
        await this.loadAll();
        return;
      }
      this.showProfileModal = false;
      this.logout();
      this.toast.info('Tu usuario no existe en la base restaurada. Inicia sesión de nuevo.', ERROR_TOAST_MS);
    }, 'No se pudo restaurar');
  }

  /** Evita operaciones concurrentes sobre la DB y unifica el manejo de errores */
  private async runDbTask(task: () => Promise<void>, errorPrefix: string) {
    if (this.dbBusy) return;
    this.dbBusy = true;
    try {
      await task();
    } catch (err) {
      this.toast.error(`${errorPrefix}: ${ipcErrorMessage(err)}`, ERROR_TOAST_MS);
    } finally {
      this.dbBusy = false;
      this.refreshView();
    }
  }

  // ───────────── Sidebar ─────────────

  get sidebarCollapsed(): boolean {
    return this.sidebar.collapsed;
  }

  get sidebarWidth(): number {
    return this.sidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : this.sidebar.width;
  }

  toggleSidebar() {
    this.sidebar.toggleCollapsed();
    this.refitActiveTerminal();
  }

  startResize(event: MouseEvent) {
    if (this.sidebarCollapsed) return;
    event.preventDefault();
    this.resizing = true;
    document.body.classList.add('is-resizing');
  }

  @HostListener('document:mousemove', ['$event'])
  onResizeMove(event: MouseEvent) {
    if (!this.resizing) return;
    this.sidebar.setWidth(event.clientX);
    this.refreshView();
  }

  @HostListener('document:mouseup')
  onResizeEnd() {
    if (!this.resizing) return;
    this.resizing = false;
    document.body.classList.remove('is-resizing');
    this.sidebar.saveWidth();
    this.refitActiveTerminal();
  }

  isExpanded(id: string): boolean {
    return this.sidebar.isExpanded(id);
  }

  toggleNode(id: string, event?: Event) {
    event?.stopPropagation();
    this.sidebar.toggle(id);
  }

  /** Reajusta xterm cuando cambia el ancho disponible (tras la transición CSS) */
  private refitActiveTerminal() {
    setTimeout(() => this.terminals.fit(this.activeConnectionId), SIDEBAR_TRANSITION_MS);
  }

  // ───────────── Consultas del árbol (para la plantilla) ─────────────

  catalogsOf(projectId: string): Catalog[] {
    return ConnectionTree.catalogsOf(this.catalogs, projectId);
  }

  projectDirectConnections(projectId: string): Connection[] {
    return ConnectionTree.projectDirect(this.connections, projectId);
  }

  projectAllConnections(projectId: string): Connection[] {
    return ConnectionTree.projectAll(this.connections, projectId);
  }

  catalogConnections(catalogId: string): Connection[] {
    return ConnectionTree.inCatalog(this.connections, catalogId);
  }

  get ungroupedConnections(): Connection[] {
    return ConnectionTree.ungrouped(this.connections);
  }

  get scopedProjects(): Project[] {
    return ConnectionTree.scopedProjects(this.projects, this.catalogs, this.dashboardScope);
  }

  /** Catálogos visibles de un proyecto según el ámbito */
  scopedCatalogs(projectId: string): Catalog[] {
    const s = this.dashboardScope;
    const list = this.catalogsOf(projectId);
    return s.type === 'catalog' ? list.filter(c => c.id === s.id) : list;
  }

  get showUngroupedSection(): boolean {
    const t = this.dashboardScope.type;
    return t === 'all' || t === 'ungrouped';
  }

  /** Catálogos disponibles en el formulario de conexión según el proyecto elegido */
  get formCatalogs(): Catalog[] {
    return this.newConnection.project_id ? this.catalogsOf(this.newConnection.project_id) : [];
  }

  getActiveConnectionName(connectionId?: string): string {
    const id = connectionId || this.activeConnectionId;
    return this.connections.find(c => c.id === id)?.name ?? '';
  }

  // ───────────── Dashboard / navegación ─────────────

  isScope(type: DashboardScope['type'], id?: string): boolean {
    if (this.activeConnectionId || this.showForm) return false;
    const s = this.dashboardScope;
    if (s.type !== type) return false;
    return !id || ('id' in s && s.id === id);
  }

  showScope(scope: DashboardScope) {
    this.dashboardScope = scope;
    this.sessionState.scope = scope;
    this.activeConnectionId = null;
    this.showForm = false;
    // Al abrir un nodo en el dashboard, expandirlo también en el sidebar
    if (scope.type === 'catalog') {
      this.sidebar.expand(ConnectionTree.projectIdOfCatalog(this.catalogs, scope.id), scope.id);
    } else if (scope.type === 'project') {
      this.sidebar.expand(scope.id);
    }
  }

  goToDashboard() {
    this.showScope({ type: 'all' });
  }

  // ───────────── Proyectos y catálogos ─────────────

  openProjectForm(project?: Project, event?: Event) {
    event?.stopPropagation();
    this.groupForm = { kind: 'project', id: project?.id, name: project?.name ?? '', project_id: '' };
  }

  openCatalogForm(projectId: string, catalog?: Catalog, event?: Event) {
    event?.stopPropagation();
    this.groupForm = {
      kind: 'catalog',
      id: catalog?.id,
      name: catalog?.name ?? '',
      project_id: catalog?.project_id ?? projectId,
    };
  }

  async saveGroupForm() {
    const form = this.groupForm;
    if (!form || !form.name.trim()) return;
    if (form.kind === 'catalog' && !form.project_id) return;

    const label = form.kind === 'project' ? 'Proyecto' : 'Catálogo';
    try {
      const createdId = form.kind === 'project' ? await this.saveProject(form) : await this.saveCatalog(form);
      this.sidebar.expand(createdId, form.kind === 'catalog' ? form.project_id : null);
      this.groupForm = null;
      await this.loadAll();
      this.toast.success(`${label} ${form.id ? 'actualizado' : 'creado'} correctamente`);
    } catch (err) {
      console.error('Error saving group:', err);
      this.toast.error(`Error al guardar el ${label.toLowerCase()}`);
    }
    this.refreshView();
  }

  /** @returns id del proyecto creado (null si se editó) */
  private async saveProject(form: GroupForm): Promise<string | null> {
    if (!form.id) return this.groupingService.addProject(form.name);
    await this.groupingService.updateProject(form.id, form.name);
    return null;
  }

  /** @returns id del catálogo creado (null si se editó) */
  private async saveCatalog(form: GroupForm): Promise<string | null> {
    if (!form.id) return this.groupingService.addCatalog(form.name, form.project_id);
    await this.groupingService.updateCatalog(form.id, form.name, form.project_id);
    return null;
  }

  async deleteProject(project: Project, event?: Event) {
    event?.stopPropagation();
    const count = this.projectAllConnections(project.id).length;
    const msg = `¿Eliminar el proyecto "${project.name}" y sus catálogos?` +
      (count ? `\nSus ${count} conexión(es) quedarán en "Sin agrupar".` : '');
    if (!confirm(msg)) return;

    try {
      await this.groupingService.deleteProject(project.id);
      if (ConnectionTree.isScopeWithin(this.dashboardScope, this.catalogs, project.id)) {
        this.dashboardScope = { type: 'all' };
      }
      await this.loadAll();
      this.toast.info('Proyecto eliminado');
    } catch (err) {
      console.error('Error deleting project:', err);
      this.toast.error('Error al eliminar el proyecto');
    }
    this.refreshView();
  }

  async deleteCatalog(catalog: Catalog, event?: Event) {
    event?.stopPropagation();
    const count = this.catalogConnections(catalog.id).length;
    const msg = `¿Eliminar el catálogo "${catalog.name}"?` +
      (count ? `\nSus ${count} conexión(es) quedarán directamente en el proyecto.` : '');
    if (!confirm(msg)) return;

    try {
      await this.groupingService.deleteCatalog(catalog.id);
      const s = this.dashboardScope;
      if (s.type === 'catalog' && s.id === catalog.id) {
        this.dashboardScope = { type: 'project', id: catalog.project_id };
      }
      await this.loadAll();
      this.toast.info('Catálogo eliminado');
    } catch (err) {
      console.error('Error deleting catalog:', err);
      this.toast.error('Error al eliminar el catálogo');
    }
    this.refreshView();
  }

  // ───────────── Formulario de conexión ─────────────

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.newConnection = this.emptyConnection();
  }

  editConnection(conn: Connection, event?: Event) {
    event?.stopPropagation();
    this.isEditing = true;
    this.showForm = true;
    // Clonamos el objeto para no modificar la vista hasta guardar
    this.newConnection = { ...conn };
  }

  cancelForm() {
    this.showForm = false;
    this.isEditing = false;
  }

  onFormProjectChange() {
    const projectOfCatalog = ConnectionTree.projectIdOfCatalog(this.catalogs, this.newConnection.catalog_id);
    if (projectOfCatalog !== this.newConnection.project_id) this.newConnection.catalog_id = null;
  }

  async saveConnection() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      if (this.isEditing) await this.updateConnection();
      else await this.createConnection();
      this.showForm = false;
      this.isEditing = false;
    } catch (err) {
      console.error('Error saving connection:', err);
      this.toast.error('Error al guardar la conexión');
    } finally {
      this.isSaving = false;
      this.refreshView();
    }
  }

  private async createConnection() {
    const created = await this.connectionService.add(this.newConnection);
    this.connections = [...this.connections, { ...this.newConnection, ...created }];
    this.toast.success('Conexión creada correctamente');
  }

  private async updateConnection() {
    const edited = this.newConnection;
    if (!edited.id) throw new Error('No se encontró el ID de la conexión a editar.');
    const grouping = await this.connectionService.update(edited);
    this.connections = this.connections.map(c => (c.id === edited.id ? { ...edited, ...grouping } : c));
    this.toast.success('Conexión actualizada correctamente');
  }

  async deleteConnection(id: string, event?: Event) {
    event?.stopPropagation();
    if (!confirm('¿Eliminar esta conexión de forma permanente?')) return;
    try {
      await this.connectionService.delete(id);
      if (this.activeSessions.includes(id)) this.disconnect(id);
      this.connections = this.connections.filter(c => c.id !== id);
      this.toast.info('Conexión eliminada');
    } catch (err) {
      console.error('Error deleting connection:', err);
      this.toast.error('Error al eliminar la conexión');
    }
    this.refreshView();
  }

  async copyPassword(conn: Connection, event?: Event) {
    event?.stopPropagation();
    if (!conn.password) {
      this.toast.info('Esta conexión no tiene contraseña o usa llave SSH');
      return;
    }
    try {
      await navigator.clipboard.writeText(conn.password);
      this.toast.success('Contraseña copiada al portapapeles');
    } catch {
      this.toast.error('Error al copiar la contraseña');
    }
  }

  /** Conexión vacía, pre-asignada al proyecto/catálogo que se está viendo */
  private emptyConnection(): Connection {
    const scope = this.dashboardScope;
    let project_id: string | null = null;
    let catalog_id: string | null = null;
    if (scope?.type === 'project') project_id = scope.id;
    if (scope?.type === 'catalog') {
      catalog_id = scope.id;
      project_id = ConnectionTree.projectIdOfCatalog(this.catalogs, scope.id);
    }
    return { name: '', host: '', port: 22, username: '', auth_type: 'password', project_id, catalog_id };
  }

  // ───────────── Terminales SSH ─────────────

  async connect(conn: Connection, event?: Event) {
    event?.stopPropagation();
    const id = conn.id;
    if (!id) return;

    this.showForm = false;
    this.activeConnectionId = id;

    if (this.activeSessions.includes(id)) {
      // Ya está abierta: solo cambiar a ella y ajustar tamaño
      await delay(TERMINAL_SWITCH_DELAY_MS);
      this.terminals.focus(id);
      return;
    }

    this.activeSessions.push(id);
    this.toast.info(`Conectando a ${conn.name}...`, CONNECTING_TOAST_MS);

    // Esperar a que la plantilla renderice el contenedor `term-<id>`
    await delay(TERMINAL_MOUNT_DELAY_MS);
    this.terminals.open(id);

    try {
      const { cols, rows } = this.terminals.size(id);
      await this.ssh.start(id, cols, rows);
      this.toast.success(`Conectado a ${conn.name}`);
    } catch (err) {
      console.error('Error connecting:', err);
      this.toast.error(`No se pudo conectar a ${conn.name}`);
      this.disconnect(id);
    }
  }

  /**
   * @param connectionId sesión a cerrar (por defecto, la activa)
   * @param isFromBackend true si el proceso ya terminó en el backend
   */
  disconnect(connectionId?: string, isFromBackend = false) {
    const id = connectionId || this.activeConnectionId;
    if (!id) return;

    const name = this.getActiveConnectionName(id);
    if (!isFromBackend) this.ssh.close(id).catch(() => {});

    this.terminals.dispose(id);
    this.activeSessions = this.activeSessions.filter(s => s !== id);
    if (this.activeConnectionId === id) {
      this.activeConnectionId = this.activeSessions.at(-1) ?? null;
    }

    if (name) this.toast.info(`Conexión cerrada: ${name}`);
    this.refitActiveTerminal();
    this.refreshView();
  }

  /** App sin zone.js: avisar a Angular tras cambios asíncronos */
  private refreshView() {
    this.cdr.markForCheck();
  }
}
