const path = require('path');
const config = require('./config');
const CH = require('./ipc/channels');
const { MainWindow } = require('./window');
const { DatabaseManager } = require('./database/database');
const { UserRepository } = require('./repositories/user.repository');
const { ProjectRepository } = require('./repositories/project.repository');
const { CatalogRepository } = require('./repositories/catalog.repository');
const { ConnectionRepository } = require('./repositories/connection.repository');
const { AuthService } = require('./services/auth.service');
const { GroupingService } = require('./services/grouping.service');
const { ConnectionService } = require('./services/connection.service');
const { SshSessionService } = require('./services/ssh-session.service');
const { BackupService } = require('./services/backup.service');

/**
 * Raíz de composición: crea las dependencias y las inyecta (Dependency Inversion).
 * Ningún servicio instancia por sí mismo a sus colaboradores.
 */
function createContainer(app) {
  const mainWindow = new MainWindow({ isDev: !app.isPackaged });
  const database = new DatabaseManager(path.join(app.getPath('userData'), config.DB_FILE_NAME));

  const userRepository = new UserRepository(database);
  const projectRepository = new ProjectRepository(database);
  const catalogRepository = new CatalogRepository(database);
  const connectionRepository = new ConnectionRepository(database);

  const authService = new AuthService(userRepository);
  const groupingService = new GroupingService({ projectRepository, catalogRepository, connectionRepository });
  const connectionService = new ConnectionService({ connectionRepository, groupingService });
  const backupService = new BackupService(database);
  const sshSessionService = new SshSessionService({
    connectionService,
    onData: (id, data) => mainWindow.send(CH.TERMINAL_INCOMING_DATA, { id, data }),
    onExit: (id, exitCode) => mainWindow.send(CH.TERMINAL_EXIT, { id, exitCode }),
  });

  return {
    app, mainWindow, database,
    authService, groupingService, connectionService, backupService, sshSessionService,
  };
}

module.exports = { createContainer };
