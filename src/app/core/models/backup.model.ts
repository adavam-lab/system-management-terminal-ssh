export interface BackupResult {
  ok: boolean;
  canceled?: boolean;
  path?: string;
}

export interface RestoreResult extends BackupResult {
  mode?: 'replace' | 'merge';
  safetyPath?: string;
  userStillExists?: boolean;
}
