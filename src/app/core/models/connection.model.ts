export type AuthType = 'password' | 'key';

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
}

/** Proyecto/catálogo normalizado que devuelve el backend al guardar */
export interface Grouping {
  project_id: string | null;
  catalog_id: string | null;
}
