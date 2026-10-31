/** Nombres de canales IPC compartidos (deben coincidir con src/app/core/ipc/ipc-channels.ts). */
module.exports = Object.freeze({
  APP_QUIT_IDLE: 'app:quit-idle',

  DB_BACKUP: 'db:backup',
  DB_RESTORE: 'db:restore',

  AUTH_HAS_USERS: 'auth:has-users',
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',
  AUTH_RECOVER_PASSWORD: 'auth:recover-password',

  GET_PROJECTS: 'get-projects',
  ADD_PROJECT: 'add-project',
  UPDATE_PROJECT: 'update-project',
  DELETE_PROJECT: 'delete-project',

  GET_CATALOGS: 'get-catalogs',
  ADD_CATALOG: 'add-catalog',
  UPDATE_CATALOG: 'update-catalog',
  DELETE_CATALOG: 'delete-catalog',

  GET_CONNECTIONS: 'get-connections',
  ADD_CONNECTION: 'add-connection',
  UPDATE_CONNECTION: 'update-connection',
  DELETE_CONNECTION: 'delete-connection',

  START_SSH: 'start-ssh',
  CLOSE_SSH: 'close-ssh',
  CLOSE_ALL_SSH: 'close-all-ssh',
  TERMINAL_KEYSTROKE: 'terminal.keystroke',
  TERMINAL_RESIZE: 'terminal.resize',
  TERMINAL_INCOMING_DATA: 'terminal.incomingData',
  TERMINAL_EXIT: 'terminal.exit',
});
