export type AuthType = 'password' | 'key';
/**
 * ssh      = terminal
 * remote   = ver y controlar el escritorio (VNC por túnel SSH)
 * rustdesk = abrir RustDesk con el ID guardado en `host` y la contraseña en `password`
 */
export type ConnectionKind = 'ssh' | 'remote' | 'rustdesk';
export type RemoteOs = 'windows' | 'mac' | 'linux';

export interface Connection {
  id?: string;
  name: string;
  host: string;
  port: number;
  username: string;
  auth_type: AuthType | string;
  password?: string;
  key_path?: string;
  project_id?: string | null;
  catalog_id?: string | null;
  kind?: ConnectionKind;
  remote_os?: RemoteOs | null;
  vnc_port?: number;
  vnc_password?: string | null;
}

/** Proyecto/catálogo normalizado que devuelve el backend al guardar */
export interface Grouping {
  project_id: string | null;
  catalog_id: string | null;
}
