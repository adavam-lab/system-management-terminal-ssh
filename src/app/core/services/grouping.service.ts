import { Injectable } from '@angular/core';
import { IpcService } from '../ipc/ipc.service';
import { IpcChannels } from '../ipc/ipc-channels';
import { Catalog, Project } from '../models';

/** Proyectos y catálogos */
@Injectable({ providedIn: 'root' })
export class GroupingService {
  constructor(private ipc: IpcService) {}

  getProjects(): Promise<Project[]> {
    return this.ipc.invoke<Project[]>(IpcChannels.GET_PROJECTS);
  }

  /** @returns id del proyecto creado */
  addProject(name: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.ADD_PROJECT, { name });
  }

  updateProject(id: string, name: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.UPDATE_PROJECT, { id, name });
  }

  deleteProject(id: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.DELETE_PROJECT, id);
  }

  getCatalogs(): Promise<Catalog[]> {
    return this.ipc.invoke<Catalog[]>(IpcChannels.GET_CATALOGS);
  }

  /** @returns id del catálogo creado */
  addCatalog(name: string, projectId: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.ADD_CATALOG, { name, project_id: projectId });
  }

  updateCatalog(id: string, name: string, projectId: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.UPDATE_CATALOG, { id, name, project_id: projectId });
  }

  deleteCatalog(id: string): Promise<string> {
    return this.ipc.invoke<string>(IpcChannels.DELETE_CATALOG, id);
  }
}
