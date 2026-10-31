const crypto = require('crypto');
const { assert, isBlank } = require('../utils/validators');

/** Reglas de negocio de proyectos y catálogos. */
class GroupingService {
  constructor({ projectRepository, catalogRepository, connectionRepository }) {
    this.projects = projectRepository;
    this.catalogs = catalogRepository;
    this.connections = connectionRepository;
  }

  // ── Proyectos ──

  getProjects() {
    return this.projects.findAll();
  }

  addProject({ name }) {
    assert(!isBlank(name), 'El nombre del proyecto es requerido.');
    const id = crypto.randomUUID();
    this.projects.create(id, name.trim());
    return id;
  }

  updateProject({ id, name }) {
    assert(id && !isBlank(name), 'Datos de proyecto inválidos.');
    this.projects.rename(id, name.trim());
    return id;
  }

  /** Sus catálogos se eliminan y sus conexiones quedan sin agrupar */
  deleteProject(id) {
    this.projects.transaction(() => {
      this.connections.ungroupByProject(id);
      this.catalogs.deleteByProject(id);
      this.projects.delete(id);
    });
    return id;
  }

  // ── Catálogos ──

  getCatalogs() {
    return this.catalogs.findAll();
  }

  addCatalog({ name, project_id }) {
    assert(!isBlank(name), 'El nombre del catálogo es requerido.');
    assert(project_id && this.projects.exists(project_id), 'El catálogo debe pertenecer a un proyecto existente.');
    const id = crypto.randomUUID();
    this.catalogs.create(id, project_id, name.trim());
    return id;
  }

  /** Si el catálogo cambia de proyecto, sus conexiones lo acompañan */
  updateCatalog({ id, name, project_id }) {
    assert(id && !isBlank(name) && project_id, 'Datos de catálogo inválidos.');
    this.projects.transaction(() => {
      this.catalogs.update(id, name.trim(), project_id);
      this.connections.moveCatalogToProject(id, project_id);
    });
    return id;
  }

  /** Sus conexiones quedan directamente en el proyecto */
  deleteCatalog(id) {
    this.projects.transaction(() => {
      this.connections.ungroupByCatalog(id);
      this.catalogs.delete(id);
    });
    return id;
  }

  /** Normaliza project/catalog de una conexión: el catálogo debe pertenecer al proyecto */
  resolveGrouping({ project_id, catalog_id }) {
    let projectId = project_id || null;
    let catalogId = catalog_id || null;

    if (catalogId) {
      const catalog = this.catalogs.findById(catalogId);
      if (catalog) projectId = catalog.project_id;
      else catalogId = null;
    }
    if (projectId && !this.projects.exists(projectId)) {
      projectId = null;
      catalogId = null;
    }
    return { project_id: projectId, catalog_id: catalogId };
  }
}

module.exports = { GroupingService };
