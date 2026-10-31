import { Catalog, Connection, DashboardScope, Project } from '../models';

/**
 * Consultas puras sobre el árbol proyecto → catálogo → conexión.
 * Sin estado ni dependencias de Angular: fáciles de probar y reutilizar.
 */
export const ConnectionTree = {
  catalogsOf: (catalogs: Catalog[], projectId: string) =>
    catalogs.filter(c => c.project_id === projectId),

  /** Conexiones directamente en el proyecto (sin catálogo) */
  projectDirect: (connections: Connection[], projectId: string) =>
    connections.filter(c => c.project_id === projectId && !c.catalog_id),

  /** Todas las conexiones del proyecto (incluye las de sus catálogos) */
  projectAll: (connections: Connection[], projectId: string) =>
    connections.filter(c => c.project_id === projectId),

  inCatalog: (connections: Connection[], catalogId: string) =>
    connections.filter(c => c.catalog_id === catalogId),

  ungrouped: (connections: Connection[]) =>
    connections.filter(c => !c.project_id),

  projectIdOfCatalog: (catalogs: Catalog[], catalogId?: string | null): string | null =>
    catalogs.find(c => c.id === catalogId)?.project_id ?? null,

  /** Proyectos visibles en el dashboard según el ámbito */
  scopedProjects(projects: Project[], catalogs: Catalog[], scope: DashboardScope): Project[] {
    switch (scope.type) {
      case 'all': return projects;
      case 'project': return projects.filter(p => p.id === scope.id);
      case 'catalog': {
        const projectId = ConnectionTree.projectIdOfCatalog(catalogs, scope.id);
        return projects.filter(p => p.id === projectId);
      }
      default: return [];
    }
  },

  /** ¿El ámbito apunta a un proyecto o catálogo que ya no existe? */
  isScopeStale(scope: DashboardScope, projects: Project[], catalogs: Catalog[]): boolean {
    if (scope.type === 'project') return !projects.some(p => p.id === scope.id);
    if (scope.type === 'catalog') return !catalogs.some(c => c.id === scope.id);
    return false;
  },

  /** ¿El ámbito actual está dentro del proyecto indicado? */
  isScopeWithin(scope: DashboardScope, catalogs: Catalog[], projectId: string): boolean {
    if (scope.type === 'project') return scope.id === projectId;
    if (scope.type === 'catalog') return ConnectionTree.projectIdOfCatalog(catalogs, scope.id) === projectId;
    return false;
  },
};
