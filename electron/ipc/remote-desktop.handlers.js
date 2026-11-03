const CH = require('./channels');

/**
 * Escritorio remoto: abre el túnel SSH, luego el puente WebSocket, y devuelve al renderer
 * la URL para noVNC junto con las credenciales VNC.
 */
function registerRemoteDesktopHandlers(ipcMain, { connectionService, sshTunnelService, vncBridgeService }) {
  ipcMain.handle(CH.REMOTE_START, async (_e, connectionId) => {
    const localPort = await sshTunnelService.open(connectionId);
    try {
      const wsUrl = await vncBridgeService.open(connectionId, localPort);
      return { wsUrl, credentials: vncCredentials(connectionService.getById(connectionId)) };
    } catch (err) {
      sshTunnelService.close(connectionId);
      throw err;
    }
  });

  ipcMain.handle(CH.REMOTE_STOP, (_e, connectionId) => {
    vncBridgeService.close(connectionId);
    return sshTunnelService.close(connectionId);
  });

  ipcMain.handle(CH.REMOTE_STOP_ALL, () => {
    vncBridgeService.closeAll();
    return sshTunnelService.closeAll();
  });
}

/**
 * - Windows/Linux (TightVNC, x11vnc): autenticación VNC clásica → solo contraseña VNC.
 * - macOS (Compartir pantalla): acepta la contraseña VNC o, si no hay, el usuario y la
 *   contraseña de la cuenta de Mac (autenticación Apple Remote Desktop).
 */
function vncCredentials(conn) {
  const password = conn.vnc_password || (conn.remote_os === 'mac' ? conn.password : '') || '';
  return { username: conn.username, password };
}

module.exports = { registerRemoteDesktopHandlers };
