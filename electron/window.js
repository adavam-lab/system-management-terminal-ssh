const { BrowserWindow } = require('electron');
const url = require('url');
const config = require('./config');

/** Crea y mantiene la referencia a la ventana principal. */
class MainWindow {
  constructor({ isDev }) {
    this.isDev = isDev;
    this.win = null;
  }

  get instance() {
    return this.win;
  }

  create() {
    this.win = new BrowserWindow({
      ...config.WINDOW_SIZE,
      icon: config.ICON_PATH,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false, // Simplificación. En producción: contextIsolation + preload.js
      },
    });
    this.win.setMenu(null);
    this.win.loadURL(this.isDev ? config.DEV_SERVER_URL : this.prodUrl());
    this.win.on('closed', () => { this.win = null; });
    return this.win;
  }

  /** Envía un evento al renderer si la ventana sigue viva */
  send(channel, payload) {
    this.win?.webContents.send(channel, payload);
  }

  prodUrl() {
    return url.format({ pathname: config.PROD_INDEX_PATH, protocol: 'file:', slashes: true });
  }
}

module.exports = { MainWindow };
