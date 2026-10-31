export interface Project {
  id: string;
  name: string;
}

export interface Catalog {
  id: string;
  project_id: string;
  name: string;
}

export type GroupKind = 'project' | 'catalog';

/** Estado del modal de creación/edición de proyecto o catálogo */
export interface GroupForm {
  kind: GroupKind;
  id?: string;
  name: string;
  project_id: string;
}

/** Ámbito que muestra el dashboard: todo, un proyecto, un catálogo o lo no agrupado */
export type DashboardScope =
  | { type: 'all' }
  | { type: 'project'; id: string }
  | { type: 'catalog'; id: string }
  | { type: 'ungrouped' };
