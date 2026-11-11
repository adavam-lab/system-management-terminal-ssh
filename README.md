<p align="center">
  <img src="public/logo.png" alt="XSSH Manager Logo" width="320" />
</p>

<h1 align="center">XSSH Manager — ADAVAM</h1>

<p align="center">
  Aplicación de escritorio para gestionar y administrar conexiones SSH de forma segura, con terminal integrada y base de datos local.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22.1-red?style=flat-square&logo=angular" />
  <img src="https://img.shields.io/badge/Electron-44.2-47848F?style=flat-square&logo=electron" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/bcryptjs-3.0-green?style=flat-square" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-0078D6?style=flat-square" />
</p>

---

## 📑 Índice

1. [Capturas de pantalla](#-capturas-de-pantalla)
2. [Características](#-características)
3. [Versiones](#-versiones)
4. [Instalación y uso](#-instalación-y-uso)
5. [Estructura del proyecto](#-estructura-del-proyecto)
6. [Arquitectura: cómo viaja una petición](#-arquitectura-cómo-viaja-una-petición)
7. [Base de datos SQLite](#️-base-de-datos-sqlite)
8. [Configuración](#-configuración)
9. [Escritorio remoto (VNC por túnel SSH)](#️-escritorio-remoto-vnc-por-túnel-ssh)
10. [RustDesk (tipo AnyDesk, desde cualquier red)](#-rustdesk-tipo-anydesk-desde-cualquier-red)
11. [Seguridad](#-seguridad)
12. [Solución de problemas frecuentes](#️-solución-de-problemas-frecuentes)
13. [Glosario para juniors](#-glosario-para-juniors)
14. [Licencia](#-licencia)

---

## 📸 Capturas de Pantalla

<p align="center">
  <img src="public/img-github/slideshow.gif" alt="Recorrido por XSSH Manager" width="900" />
</p>

<details>
<summary><b>🖼️ Ver todas las capturas</b></summary>
<br />

| Login | Dashboard |
|:-----:|:---------:|
| <img src="public/img-github/login.png" width="420" /> | <img src="public/img-github/dash.png" width="420" /> |
| **Conexión** | **Perfil y respaldo** |
| <img src="public/img-github/conecction.png" width="420" /> | <img src="public/img-github/profile-backup.png" width="420" /> |
| **Respaldo y restauración** | **Recuperación de cuenta** |
| <img src="public/img-github/backup-restore.png" width="420" /> | <img src="public/img-github/recovery.png" width="420" /> |

</details>

---

## ✨ Características

- 🔐 **Autenticación segura** con bcryptjs (hash de contraseñas) y recuperación por PIN
- 🗄️ **Base de datos local** SQLite — sin servidores externos
- 💻 **Terminal SSH integrada** con xterm.js y node-pty
- 🧩 **Gestión de conexiones** — agregar, editar, eliminar
- 🗂️ **Agrupación** de conexiones en proyectos y catálogos
- 🔑 **Soporte de autenticación** por contraseña o llave privada SSH
- 💾 **Respaldo y restauración** de la base de datos
- ⏱️ **Cierre por inactividad**
- 📦 **Instaladores nativos** para Windows (`.exe`) y macOS (`.dmg`) con electron-builder
- 🖥️ **Escritorio remoto** — ver y controlar equipos Windows, macOS o Linux (VNC por túnel SSH, [detalles](#️-escritorio-remoto-vnc-por-túnel-ssh))
- 🌐 **RustDesk** — acceso tipo AnyDesk desde cualquier red, con servidor propio ([detalles](#-rustdesk-tipo-anydesk-desde-cualquier-red))

---

## 📦 Versiones

Versiones instaladas en el proyecto (`npm ls --depth=0`, octubre 2026).

### Entorno

| Tecnología | Versión |
|------------|---------|
| Node.js | 24.15.0 (mínimo 20.x) |
| npm | 11.x (`packageManager`: 11.12.1) |
| Angular (core) | 22.1.5 |
| Angular CLI / build | 22.1.7 |
| Electron | 44.2.0 |
| electron-builder | 26.15.3 |
| TypeScript | 6.0.3 |

### Dependencias principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `better-sqlite3` | 13.0.3 | Base de datos SQLite local |
| `bcryptjs` | 3.0.3 | Hash seguro de contraseñas |
| `node-pty` | 1.1.0 | Lanza el proceso `ssh` en una pseudoterminal |
| `@xterm/xterm` | 6.0.0 | Dibuja la terminal en la UI |
| `@xterm/addon-fit` | 0.11.0 | Ajusta la terminal al tamaño del contenedor |
| `rxjs` | 7.8.2 | Eventos IPC como `Observable` |
| `concurrently` | 10.0.5 | Ejecuta Angular + Electron en paralelo |
| `wait-on` | 9.1.0 | Espera a que Angular esté listo antes de abrir Electron |
| `vitest` | 4.1.11 | Pruebas unitarias |

### Dependencias del escritorio remoto

| Paquete | Versión | Uso |
|---------|---------|-----|
| `@novnc/novnc` | 1.7.0 | Cliente VNC que dibuja la pantalla remota en un `<canvas>` |
| `ws` | 8.22.1 | Servidor WebSocket en el proceso main (puente hacia VNC) |

---

## 🚀 Instalación y Uso

### Prerrequisitos

- **Node.js** ≥ 20.x — [nodejs.org](https://nodejs.org)
- **npm** 11.x (incluido con Node.js)
- **Cliente `ssh`** del sistema (incluido en macOS, Linux y Windows 10+)
- **Herramientas de compilación nativa** (las necesitan `node-pty` y `better-sqlite3`):
  - **Windows:** [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) con **Desarrollo de escritorio con C++**
  - **macOS:** `xcode-select --install`

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ssh-manager.git
cd ssh-manager
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Modo desarrollo

Inicia Angular (puerto 4050) y Electron en paralelo con hot-reload:

```bash
npm start
```

> La app detecta automáticamente si hay usuarios en la DB.
> - **Sin usuarios** → muestra el formulario de registro
> - **Con usuarios** → muestra el formulario de login

### 4. Generar instalador

```bash
npm run electron:build
```

Genera `XSSH Manager-Setup-<versión>.exe` en Windows o `XSSH Manager <versión>.dmg` en macOS, dentro de `dist/`.

### Scripts disponibles

| Script | Qué hace |
|--------|----------|
| `npm start` | Angular en `localhost:4050` + Electron |
| `npm run build` | Compila Angular a `dist/ssh-manager/browser` |
| `npm run watch` | Compila Angular en modo desarrollo al guardar |
| `npm run electron:build` | Compila Angular y genera el instalador |
| `npm test` | Ejecuta las pruebas |

---

## 📁 Estructura del Proyecto

El proyecto tiene dos mitades:

- **`electron/`** — el **proceso main** (Node.js). Tiene acceso al sistema: archivos, procesos, base de datos, red.
- **`src/app/`** — el **proceso renderer** (Angular). Solo interfaz; pide todo al main por IPC.

```
system-management-terminal-ssh/
├── main.js                         # Punto de entrada de Electron: crea el contenedor y la ventana
├── package.json                    # Dependencias, scripts y config de electron-builder
├── angular.json                    # Configuración de Angular CLI
├── build/                          # Licencia y script NSIS del instalador de Windows
├── rustdesk-server/                # docker-compose del servidor RustDesk + scripts para PCs remotas
├── public/                         # Logos, favicon e imágenes del README
│
├── electron/                       # ===== PROCESO MAIN (Node) =====
│   ├── config.js                   # Constantes centralizadas (puertos, rutas, tamaños)
│   ├── container.js                # Crea todos los servicios e inyecta sus dependencias
│   ├── window.js                   # Ventana principal (BrowserWindow)
│   ├── database/
│   │   ├── database.js             # Abre SQLite y aplica migraciones
│   │   └── schema.js               # CREATE TABLE + lista de MIGRATIONS
│   ├── repositories/               # SQL puro: una clase por tabla
│   │   ├── user.repository.js
│   │   ├── project.repository.js
│   │   ├── catalog.repository.js
│   │   └── connection.repository.js
│   ├── services/                   # Lógica de negocio (no conocen Electron)
│   │   ├── auth.service.js         # Registro, login, recuperación
│   │   ├── grouping.service.js     # Proyectos y catálogos
│   │   ├── connection.service.js   # CRUD de conexiones
│   │   ├── ssh-session.service.js  # Terminal SSH con node-pty
│   │   ├── ssh-tunnel.service.js   # Túnel ssh -N -L para el escritorio remoto
│   │   ├── vnc-bridge.service.js   # Puente WebSocket ↔ TCP para noVNC
│   │   ├── rustdesk.service.js     # Abre el cliente RustDesk con ID y contraseña
│   │   └── backup.service.js       # Respaldo y restauración
│   ├── ipc/                        # Conecta canales IPC con servicios
│   │   ├── channels.js             # Nombres de canales (fuente de verdad)
│   │   ├── index.js                # Registra todos los handlers
│   │   └── *.handlers.js           # Un archivo por área (auth, terminal, backup…)
│   └── utils/                      # Validadores y utilidades de tiempo
│
└── src/
    ├── index.html / main.ts / styles.css
    ├── types/novnc.d.ts            # Tipos de noVNC
    └── app/                        # ===== PROCESO RENDERER (Angular) =====
        ├── app.ts / app.html / app.css   # Pantalla principal (sidebar + pestañas de terminal)
        ├── login/                  # Pantalla de login / registro / recuperación
        ├── remote-desktop/         # Pestaña de escritorio remoto (noVNC)
        └── core/
            ├── ipc/
            │   ├── ipc-channels.ts # Copia de channels.js para TypeScript
            │   └── ipc.service.ts  # Único acceso a ipcRenderer
            ├── models/             # Interfaces (Connection, User, Group…)
            ├── services/           # Un servicio Angular por área (ssh, auth, backup…)
            └── utils/              # Árbol de conexiones, validadores, storage
```

> **Regla de oro:** Angular nunca toca el sistema directamente. Todo lo que abre procesos, puertos o archivos vive en `electron/` y Angular lo pide por IPC.

---

## 🧭 Arquitectura: cómo viaja una petición

Cada petición pasa por cuatro capas, siempre en el mismo orden. Ejemplo real: abrir una terminal SSH.

```
 Angular                         IPC                       Electron (main)
┌──────────────────────┐   invoke('start-ssh')   ┌───────────────────────────┐
│ SshService.start()   │ ──────────────────────► │ terminal.handlers.js      │
│ (core/services)      │                         │   └► SshSessionService    │
│                      │ ◄────────────────────── │        └► ConnectionService│
│ incomingData$ (on)   │  send('terminal.        │             └► Connection- │
└──────────────────────┘   incomingData')        │                Repository  │
                                                 └───────────────────────────┘
```

| Capa | Dónde vive | Qué hace | Ejemplo (terminal) |
|------|-----------|----------|--------------------|
| 1. Repositorio | `electron/repositories/` | Solo SQL contra SQLite | `ConnectionRepository.findById()` |
| 2. Servicio | `electron/services/` | Lógica; no importa Electron | `SshSessionService.start()` lanza `ssh` con node-pty |
| 3. Handler IPC | `electron/ipc/*.handlers.js` | Une un canal con un servicio | `ipcMain.handle('start-ssh', …)` |
| 4. Servicio Angular | `src/app/core/services/` | Llama al canal con `IpcService` | `SshService.start(id, cols, rows)` |

Conceptos clave:

- **`electron/container.js`** crea cada servicio y le pasa lo que necesita (inyección de dependencias). Ningún servicio hace `new` de otro.
- **`channels.js` e `ipc-channels.ts`** deben tener **exactamente** los mismos nombres. Si no coinciden, el mensaje se pierde sin error.
- **`invoke`** pide algo y espera respuesta (`ipcMain.handle`). **`send`** envía sin esperar (`ipcMain.on`). **`on`** escucha eventos que el main manda con `mainWindow.send`.

---

## 🗄️ Base de Datos SQLite

La base de datos se crea automáticamente en la carpeta de datos del usuario (`app.getPath('userData')`):

```
Windows: C:\Users\<usuario>\AppData\Roaming\ssh-manager\ssh-manager.db
macOS:   ~/Library/Application Support/ssh-manager/ssh-manager.db
```

Las tablas se definen en `electron/database/schema.js`. Los cambios de columnas se hacen **solo agregando** sentencias al final de `MIGRATIONS`; nunca se editan las anteriores.

#### Tabla `users`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `username` | TEXT UNIQUE | Nombre de usuario |
| `name` | TEXT | Nombre |
| `lastname` | TEXT | Apellido |
| `email` | TEXT UNIQUE | Correo electrónico |
| `password` | TEXT | Hash bcrypt de la contraseña |
| `recovery_pin` | TEXT | PIN de recuperación de cuenta |

#### Tabla `projects`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `name` | TEXT | Nombre del proyecto |

#### Tabla `catalogs`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `project_id` | TEXT | Proyecto al que pertenece |
| `name` | TEXT | Nombre del catálogo |

#### Tabla `connections`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | TEXT (PK) | UUID |
| `name` | TEXT | Nombre del perfil |
| `host` | TEXT | IP o hostname del servidor (en `rustdesk`: el ID de RustDesk) |
| `port` | INTEGER | Puerto SSH (default: 22) |
| `username` | TEXT | Usuario SSH |
| `auth_type` | TEXT | `password` o `key` |
| `password` | TEXT | Contraseña (opcional; en `rustdesk`: la contraseña permanente) |
| `key_path` | TEXT | Ruta a llave privada SSH (opcional) |
| `project_id` | TEXT | Proyecto (opcional) |
| `catalog_id` | TEXT | Catálogo (opcional) |
| `kind` | TEXT | `ssh` (terminal), `remote` (escritorio VNC) o `rustdesk`. Default: `ssh` |
| `remote_os` | TEXT | `windows`, `mac` o `linux` (para `remote` y, opcional, `rustdesk`) |
| `vnc_port` | INTEGER | Puerto VNC del equipo remoto (default: 5900) |
| `vnc_password` | TEXT | Contraseña VNC (opcional) |

---

## 🔧 Configuración

### Constantes del proceso main (`electron/config.js`)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `DEV_SERVER_URL` | `http://localhost:4050` | URL de Angular en desarrollo |
| `WINDOW_SIZE` | 1200 × 800 | Tamaño inicial de la ventana |
| `DB_FILE_NAME` | `ssh-manager.db` | Nombre del archivo SQLite |
| `BCRYPT_ROUNDS` | 10 | Costo del hash de contraseñas |
| `MIN_PASSWORD_LENGTH` | 8 | Largo mínimo de contraseña |
| `DEFAULT_SSH_PORT` | 22 | Puerto SSH por defecto |
| `DEFAULT_TERMINAL_SIZE` | 80 × 30 | Columnas × filas iniciales |
| `DEFAULT_VNC_PORT` | 5900 | Puerto VNC por defecto |
| `TUNNEL_READY_TIMEOUT_MS` | 15000 | Espera máxima para que el túnel SSH abra |
| `CONNECTION_KINDS` | `ssh`, `remote`, `rustdesk` | Tipos de conexión válidos |
| `RUSTDESK_EXECUTABLES` | rutas por sistema | Dónde se busca el cliente RustDesk local |
| `RUSTDESK_CONFIG_FILES` | rutas por sistema | `RustDesk2.toml` local, para detectar el servidor propio |
| `REMOTE_OS` | `windows`, `mac`, `linux` | Sistemas remotos válidos |

### electron-builder (`package.json` → `build`)

```json
"build": {
  "appId": "com.ssh-manager.app",
  "productName": "XSSH Manager",
  "mac": { "target": ["dmg"], "icon": "public/logo-single.png" },
  "win": { "icon": "public/logo-single.png" },
  "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }
}
```

### Angular (`angular.json`) — Presupuestos de bundle

```json
"budgets": [
  { "type": "initial", "maximumWarning": "1MB",  "maximumError": "1.5MB" },
  { "type": "anyComponentStyle", "maximumWarning": "10kB", "maximumError": "15kB" }
]
```

---

## 🖥️ Escritorio remoto (VNC por túnel SSH)

Además de terminales, una conexión puede ser de tipo **Escritorio remoto**: abre una pestaña con la pantalla de un equipo **Windows, macOS o Linux** y te deja controlarlo con mouse y teclado desde el equipo donde está instalado XSSH Manager.

### Cómo usarlo

1. Prepara el equipo remoto una sola vez ([Configurar el equipo remoto](#configurar-el-equipo-remoto)).
2. En XSSH Manager pulsa **+ Conexión** y elige **Tipo de conexión → Escritorio remoto**.
3. Llena los datos SSH del equipo remoto (host, puerto SSH, usuario y contraseña o llave): son los que abren el túnel.
4. En el bloque *Escritorio remoto* elige el **sistema** (Windows / macOS / Linux), el **puerto VNC** (5900 por defecto) y la **contraseña VNC**.
   - En **macOS** puedes dejar vacía la contraseña VNC: se usa la contraseña de la cuenta de Mac.
5. Guarda y pulsa **Ver escritorio** en la tarjeta (o la conexión en el sidebar).

En la barra de la pestaña tienes:

| Botón | Qué hace |
|-------|----------|
| **Ctrl+Alt+Supr** | Lo envía al equipo remoto (Windows/Linux). Tu equipo no lo intercepta. |
| **Pegar texto** | Envía el texto de tu portapapeles al portapapeles del remoto. |
| **Solo ver** | Mira la pantalla sin mover el mouse ni teclear en el remoto. |
| **Reconectar** | Aparece si se cae la conexión. |

El texto que copias en el remoto llega solo a tu portapapeles. La pantalla remota se escala al tamaño de la pestaña y no cambia la resolución del otro equipo. La sesión es **compartida**: no expulsa a quien esté usando el equipo.

### ¿Por qué VNC por túnel SSH y no algo tipo RustDesk?

| Opción | Qué necesita el equipo remoto | Esfuerzo | Cuándo conviene |
|--------|-------------------------------|----------|-----------------|
| **VNC por túnel SSH + noVNC** ✅ (la implementada) | SSH + servidor VNC | Bajo-medio | Ya llegamos al equipo por SSH (LAN, VPN o puerto 22) |
| Cliente externo (RDP / `vnc://`) | RDP o VNC | Muy bajo | Algo rápido, pero se ve fuera de la app |
| Estilo RustDesk (P2P, atraviesa NAT) | Un agente propio instalado | Alto (semanas) | Equipos detrás de NAT sin SSH |

- **No abre puertos nuevos:** el VNC remoto escucha solo en `localhost`; el único puerto expuesto sigue siendo el 22.
- **Todo va cifrado** por SSH (VNC por sí solo cifra mal).
- **Sin servidores propios** ni agentes que instalar.

**Limitación:** igual que la terminal, el equipo remoto debe ser alcanzable por SSH desde tu equipo.

### Cómo funciona

```
┌───────────────────────── XSSH Manager (tu equipo) ─────────────────────────┐
│                                                                           │
│  Angular (renderer)              Electron (main)                          │
│  ┌──────────────────┐  WS   ┌──────────────────┐  TCP  ┌──────────────┐   │
│  │ RemoteDesktop-   │──────►│ VncBridgeService │──────►│ ssh -N -L    │   │
│  │ Component        │       │ ws://127.0.0.1:  │       │ 127.0.0.1:   │   │
│  │ (<canvas> noVNC) │◄──────│ <puerto>?token=  │◄──────│ <libre>      │   │
│  └──────────────────┘       └──────────────────┘       └──────┬───────┘   │
│                                                               │           │
└───────────────────────────────────────────────────────────────┼───────────┘
                                        túnel cifrado, puerto 22 │
┌──────────────────────── Equipo remoto ────────────────────────┼───────────┐
│                                   sshd ◄──────────────────────┘           │
│                                    │                                      │
│                                    └──► servidor VNC en 127.0.0.1:5900    │
└───────────────────────────────────────────────────────────────────────────┘
```

1. Al abrir la pestaña, `RemoteDesktopComponent` llama al canal IPC `remote:start` con el id de la conexión.
2. `SshTunnelService` lanza `ssh -N -L 127.0.0.1:<libre>:127.0.0.1:<vnc_port> usuario@host` y espera a que el puerto local responda (ssh solo lo abre después de autenticar).
3. `VncBridgeService` abre un servidor WebSocket en `127.0.0.1` con un **token aleatorio** que reenvía los bytes al puerto del túnel.
4. El handler devuelve `{ wsUrl, credentials }` y noVNC dibuja la pantalla remota en un `<canvas>`.
5. Al cerrar la pestaña, el componente se destruye y llama a `remote:stop`, que cierra el puente y mata el proceso `ssh`.

¿Por qué hace falta el puente? noVNC corre en el navegador (renderer) y **solo habla WebSocket**; el servidor VNC habla **TCP**. El puente traduce entre los dos.

### Recorrido por el código

| Archivo | Qué hace |
|---------|----------|
| [`electron/config.js`](electron/config.js) | `DEFAULT_VNC_PORT`, `TUNNEL_READY_TIMEOUT_MS`, `CONNECTION_KINDS`, `REMOTE_OS` |
| [`electron/database/schema.js`](electron/database/schema.js) | Migraciones: columnas `kind`, `remote_os`, `vnc_port`, `vnc_password` |
| [`electron/repositories/connection.repository.js`](electron/repositories/connection.repository.js) | Incluye las columnas nuevas en `INSERT` y `UPDATE` |
| [`electron/services/connection.service.js`](electron/services/connection.service.js) | `normalize()`: valida el sistema remoto y pone valores por defecto |
| [`electron/services/ssh-tunnel.service.js`](electron/services/ssh-tunnel.service.js) | Abre/cierra el túnel `ssh -N -L`; traduce los errores de ssh a mensajes claros |
| [`electron/services/vnc-bridge.service.js`](electron/services/vnc-bridge.service.js) | Puente WebSocket ↔ TCP con token por sesión |
| [`electron/ipc/remote-desktop.handlers.js`](electron/ipc/remote-desktop.handlers.js) | Canales `remote:start`, `remote:stop`, `remote:stop-all`; arma las credenciales VNC |
| [`electron/container.js`](electron/container.js) | Crea ambos servicios; si el túnel cae, cierra el puente y emite `remote:exit` |
| [`main.js`](main.js) | `before-quit`: cierra todos los túneles al salir |
| [`src/types/novnc.d.ts`](src/types/novnc.d.ts) | Tipos TypeScript de la parte de noVNC que usamos |
| [`src/app/core/services/remote-desktop.service.ts`](src/app/core/services/remote-desktop.service.ts) | Envoltorio Angular de los canales `remote:*` |
| [`src/app/remote-desktop/remote-desktop.component.ts`](src/app/remote-desktop/remote-desktop.component.ts) | Pantalla remota (noVNC), barra de acciones, pedir contraseña, reconectar |
| [`src/app/app.ts`](src/app/app.ts) / [`app.html`](src/app/app.html) | Formulario con *Tipo de conexión*, tarjetas y pestañas remotas |

Decisiones que conviene entender:

- **El túnel usa node-pty**, igual que la terminal, para reutilizar `createAutoResponder()` de `SshSessionService` (acepta el fingerprint y escribe la contraseña).
- **`-o NumberOfPasswordPrompts=1` y `ExitOnForwardFailure=yes`** hacen que ssh termine enseguida si algo falla, en vez de quedarse esperando.
- **Puertos `0`:** túnel y puente piden al sistema un puerto libre, así puedes abrir varios escritorios a la vez.
- **Las credenciales VNC** las arma el main: Windows/Linux usan la contraseña VNC; macOS usa la contraseña VNC o, si está vacía, usuario + contraseña de la cuenta (autenticación Apple Remote Desktop).
- **No se usa `prompt()`**: Electron no lo soporta. Si falta la contraseña, el componente muestra su propio formulario.

### Configurar el equipo remoto

El equipo que vas a ver necesita **un servidor SSH que permita túneles** y **un servidor VNC**, idealmente escuchando solo en `localhost`.

#### Permitir túneles en SSH (todos los sistemas)

En `/etc/ssh/sshd_config` (Windows: `C:\ProgramData\ssh\sshd_config`) confirma esta línea y reinicia el servicio SSH:

```text
AllowTcpForwarding yes
```

#### Windows 10/11

1. Instala y arranca OpenSSH Server (PowerShell como administrador):

   ```powershell
   Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
   Start-Service sshd
   Set-Service -Name sshd -StartupType Automatic
   ```

2. Instala **TightVNC Server** (modo servicio) y define una contraseña: es la **Contraseña VNC** de la conexión.
3. En TightVNC → Configuración → Acceso: marca *"Allow loopback connections"* y *"Allow only loopback connections"*.
4. En XSSH Manager: usuario y contraseña de la cuenta de Windows, sistema **Windows**, puerto VNC **5900**.

#### macOS

1. Ajustes del Sistema → General → Compartir → activa **Sesión remota** (SSH).
2. En la misma pantalla activa **Compartir pantalla**.
3. *(Opcional)* Pulsa la ⓘ de Compartir pantalla → activa *"Los visualizadores VNC pueden controlar la pantalla con contraseña"* y define una contraseña (máximo 8 caracteres). Si no lo haces, deja vacía la **Contraseña VNC** y se usará la de tu cuenta.
4. macOS escucha en todas las interfaces: bloquea el puerto 5900 en el firewall de la red y conéctate siempre por el túnel.

#### Linux (sesión X11)

```bash
sudo apt install x11vnc            # Debian/Ubuntu
x11vnc -storepasswd                # guarda la contraseña en ~/.vnc/passwd
x11vnc -display :0 -localhost -rfbauth ~/.vnc/passwd -forever -shared
```

- `-localhost` = solo acepta conexiones del propio equipo (las que llegan por el túnel).
- Si el escritorio usa **Wayland**, x11vnc no funciona: usa `wayvnc` (Sway/Hyprland) o elige la sesión "Xorg" en el login.
- Servidor sin pantalla física: TigerVNC con `vncserver :1 -localhost yes` (puerto **5901**).

#### Comprobar sin XSSH Manager

Si algo falla, valida el equipo remoto con un cliente VNC cualquiera:

```bash
ssh -N -L 5901:localhost:5900 usuario@IP_REMOTA
# en otra terminal (macOS):
open vnc://localhost:5901
```

Si así se ve la pantalla, el problema está en la configuración de la conexión en XSSH Manager.

### Pruebas manuales

| # | Prueba | Resultado esperado |
|---|--------|--------------------|
| 1 | Abrir escritorio con datos correctos | Punto verde "Conectado" y se ve la pantalla |
| 2 | Contraseña SSH incorrecta | "SSH rechazó el usuario, la contraseña o la llave." |
| 3 | Host apagado o IP errónea | "No se pudo alcanzar el equipo remoto…" |
| 4 | VNC apagado en el remoto | "Se perdió la conexión con el servidor VNC…" + botón Reconectar |
| 5 | Contraseña VNC incorrecta | "Contraseña VNC rechazada" |
| 6 | Contraseña VNC vacía (Windows) | Formulario "El equipo remoto pide la contraseña VNC" |
| 7 | Cerrar la pestaña o la app | No queda ningún `ssh -N` (`ps aux \| grep "ssh -N"`) |
| 8 | Abrir terminal y escritorio a la vez | Ambas pestañas funcionan |
| 9 | Desconectar la red del remoto | En ~60 s: "El túnel SSH se cerró" |

---

## 🌐 RustDesk (tipo AnyDesk, desde cualquier red)

El escritorio VNC necesita que llegues a la PC por SSH (misma red o VPN). **RustDesk no**: la PC remota y la tuya se conectan *hacia afuera* a un servidor intermedio, así que funciona aunque estén detrás de NAT, en otra ciudad o sin VPN. Es lo mismo que hacen AnyDesk o TeamViewer, pero open source y con **servidor propio**.

XSSH Manager guarda el **ID** y la **contraseña** de cada equipo y, al pulsar **Abrir RustDesk**, lanza el cliente RustDesk de tu PC ya conectado a ese equipo.

### Piezas

```
   Tu PC (XSSH Manager + RustDesk)                        PC remota (RustDesk como servicio)
   ┌─────────────────────────────┐                       ┌─────────────────────────────┐
   │ "Abrir RustDesk"            │                       │ ID 123 456 789              │
   │  → rustdesk --connect <ID>  │                       │ contraseña permanente       │
   │       --password <clave>    │                       │                             │
   └──────────────┬──────────────┘                       └──────────────┬──────────────┘
                  │ 1. ¿dónde está el ID 123456789?                      │ registra su ID
                  └──────────────►┌───────────────────────────┐◄────────┘
                                  │ Servidor propio (Docker)  │
                                  │ hbbs :21115-21116  (IDs)  │
                                  │ hbbr :21117      (relay)  │
                                  └───────────────────────────┘
                  2. conexión directa P2P cifrada; si no se puede, pasa por hbbr
```

| Pieza | Dónde | Qué es |
|-------|-------|--------|
| **hbbs / hbbr** | Un servidor con IP pública (VPS o equipo de la oficina con puertos abiertos) | Servidor RustDesk OSS: directorio de IDs + relay |
| **Cliente RustDesk "controlador"** | Tu PC, donde está XSSH Manager | La ventana que muestra la pantalla remota |
| **Cliente RustDesk "controlado"** | Cada PC Windows / Mac / Linux | Servicio que comparte la pantalla con contraseña permanente |
| **XSSH Manager** | Tu PC | Guarda ID + contraseña y abre RustDesk conectado |

> Puedes saltarte el servidor propio y usar los servidores públicos de RustDesk para probar, pero son lentos y compartidos. Para trabajo real, usa el tuyo.

### Paso 1 — Levantar el servidor (una vez)

En un servidor Linux con Docker y una IP pública (o un dominio, ej. `rd.miempresa.com`):

```bash
# copia la carpeta rustdesk-server/ del repositorio al servidor
cd rustdesk-server
docker compose up -d
cat data/id_ed25519.pub     # ← la CLAVE pública; la necesitan todos los clientes
```

Abre en el firewall / router: **21115/tcp, 21116/tcp, 21116/udp, 21117/tcp**.

> ⚠️ `data/id_ed25519` es la llave **privada** del servidor: no la compartas ni la subas a git (ya está en `.gitignore`).

Versiones: imagen `rustdesk/rustdesk-server:1.1.16`, cliente RustDesk **1.5.0** (mínimo recomendado 1.4.x).

### Paso 2 — Preparar cada PC remota (una vez por equipo)

Usa los scripts de [`rustdesk-server/scripts/`](rustdesk-server/scripts/). Instalan RustDesk (Windows/Linux), configuran tu servidor y la clave, fijan una contraseña permanente e imprimen el **ID**.

**Windows** (PowerShell como administrador):

```powershell
powershell -ExecutionPolicy Bypass -File .\instalar-windows.ps1 `
  -Servidor rd.miempresa.com -Clave "CLAVE_DE_id_ed25519.pub" -Contrasena "UnaClaveLarga2026"
```

**Linux** (Debian/Ubuntu):

```bash
sudo ./instalar-linux.sh rd.miempresa.com "CLAVE_DE_id_ed25519.pub" "UnaClaveLarga2026"
```

**macOS** — macOS no deja conceder permisos de pantalla por script, así que primero a mano:

1. `brew install --cask rustdesk` (o el `.dmg` de [GitHub](https://github.com/rustdesk/rustdesk/releases/latest)).
2. Abre RustDesk y concede **Grabación de pantalla** y **Accesibilidad** en Ajustes del Sistema → Privacidad y seguridad.
3. En RustDesk: menú → **Instalar servicio**.
4. Luego: `sudo ./configurar-mac.sh rd.miempresa.com "CLAVE_DE_id_ed25519.pub" "UnaClaveLarga2026"`

Anota el **ID** que imprime el script.

**Sin scripts (manual, cualquier sistema):** RustDesk → Ajustes → **Red** → *Servidor de ID* = tu servidor, *Key* = la clave → Ajustes → **Seguridad** → *Contraseña permanente*. El ID aparece en la pantalla principal.

### Paso 3 — Configurar tu PC (la que controla)

1. Instala RustDesk en la PC donde usas XSSH Manager.
2. RustDesk → Ajustes → **Red**: el mismo *Servidor de ID* y la misma *Key* del paso 1.

El formulario de XSSH Manager te avisa si RustDesk no está instalado o si todavía usa los servidores públicos.

### Paso 4 — Crear la conexión en XSSH Manager

1. **+ Conexión** → *Tipo de conexión* → **RustDesk**.
2. Nombre, **ID de RustDesk** (con o sin espacios), sistema (opcional) y **contraseña permanente**.
3. Guarda y pulsa **Abrir RustDesk**.

Si dejas la contraseña vacía, RustDesk la pedirá al conectar.

### Código

| Archivo | Qué hace |
|---------|----------|
| [`electron/services/rustdesk.service.js`](electron/services/rustdesk.service.js) | Busca el ejecutable de RustDesk, lee si el cliente usa servidor propio y lanza `--connect <ID> --password <clave>` |
| [`electron/ipc/rustdesk.handlers.js`](electron/ipc/rustdesk.handlers.js) | Canales `rustdesk:status` y `rustdesk:launch` |
| [`electron/services/connection.service.js`](electron/services/connection.service.js) | `normalizeRustDesk()`: valida el ID y lo guarda en `host`; la contraseña va en `password` |
| [`electron/config.js`](electron/config.js) | `RUSTDESK_EXECUTABLES` y `RUSTDESK_CONFIG_FILES` por sistema |
| [`src/app/core/services/rustdesk.service.ts`](src/app/core/services/rustdesk.service.ts) | Envoltorio Angular de los canales |
| [`rustdesk-server/`](rustdesk-server/) | `docker-compose.yml` del servidor y scripts para preparar PCs remotas |

Decisiones:

- **El ID se guarda en `host` y la contraseña en `password`**: así no cambia la tabla (esas columnas son `NOT NULL`) y "Copiar clave" funciona igual.
- **Se usa el cliente oficial** en vez de reimplementar el protocolo: RustDesk ya resuelve P2P, NAT, cifrado y relay.
- Rutas donde se busca RustDesk: macOS `/Applications/RustDesk.app`, Windows `C:\Program Files\RustDesk\rustdesk.exe`, Linux `/usr/bin/rustdesk`.
- La ventana de RustDesk es independiente: no ocupa una pestaña y sigue abierta aunque cierres XSSH Manager.

### ¿VNC o RustDesk?

| | Escritorio (VNC) | RustDesk |
|--|------------------|----------|
| Requiere llegar por SSH (red/VPN) | Sí | No |
| Requiere servidor propio | No | Recomendado |
| Se ve dentro de XSSH Manager | Sí (pestaña) | No (ventana de RustDesk) |
| Instalar en la PC remota | sshd + servidor VNC | Cliente RustDesk |
| Transferencia de archivos, audio, multi-monitor | No | Sí |

---

## 🔐 Seguridad

- Las contraseñas de usuario se almacenan con **bcryptjs** (salt rounds = 10).
- La base de datos SQLite es **local** y no se transmite a ningún servidor.
- Las contraseñas SSH y VNC se guardan en **texto plano** en SQLite — se recomienda usar **llaves SSH** en producción.
- **Escritorio remoto:**
  - El servidor VNC remoto debe escuchar **solo en `localhost`** (`-localhost`, "only loopback"). Nunca expongas el puerto 5900 a internet.
  - El túnel y el puente escuchan solo en `127.0.0.1`, nunca en `0.0.0.0`.
  - Cada puente usa un **token aleatorio** por sesión; no lo registres en logs.
  - Cierra siempre túnel y puente juntos (`REMOTE_STOP`) para no dejar puertos abiertos.
- **RustDesk:**
  - Usa **servidor propio** y una **contraseña permanente larga y distinta** por equipo.
  - `rustdesk-server/data/id_ed25519` es la llave privada del servidor: no la compartas.
  - Al abrir una conexión, la contraseña viaja como argumento de `rustdesk --password`, por lo que es visible un instante en la lista de procesos de **tu** equipo.
- La ventana usa `nodeIntegration: true` y `contextIsolation: false` (ver `electron/window.js`). Es una simplificación: lo recomendable a futuro es `contextIsolation: true` con un `preload.js`.

---

## 🛠️ Solución de Problemas Frecuentes

### Error `AttachConsole failed` al abrir terminal (Windows)
En Electron bajo Windows, `node-pty` puede fallar al usar ConPTY porque la app no tiene una consola nativa visible.
**Solución (ya aplicada):** `useConpty: false` en `electron/services/ssh-session.service.js` para usar el backend `winpty`. El túnel del escritorio remoto usa la misma opción.

### Demora al guardar, editar o eliminar conexiones
Las respuestas IPC llegan fuera del ciclo de detección de cambios de Angular, y la UI no se actualizaba al instante.
**Solución (ya aplicada):** `IpcService` resuelve las promesas dentro de `this.zone.run()`.

### Escritorio remoto

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| "SSH rechazó el usuario, la contraseña o la llave." | Credenciales SSH erróneas | Prueba `ssh usuario@host` en una terminal |
| "El equipo remoto no permite túneles…" | `AllowTcpForwarding no` en el remoto | [Permitir túneles en SSH](#permitir-túneles-en-ssh-todos-los-sistemas) |
| "El equipo remoto rechazó la conexión SSH…" | Servicio SSH apagado (en Windows: `sshd`) | Arráncalo; en Windows `Start-Service sshd` |
| "El túnel SSH no respondió a tiempo" | Red lenta o SSH colgado | Revisa la red; prueba `ssh usuario@host` |
| "Se perdió la conexión con el servidor VNC…" | VNC apagado o en otro puerto | Revisa el *Puerto VNC*; en Linux confirma que `x11vnc` sigue corriendo |
| "Contraseña VNC rechazada" | Contraseña VNC errónea | Edita la conexión; en macOS prueba dejarla vacía (usa la de la cuenta) |
| `x11vnc` no arranca en Linux | El escritorio usa Wayland | Usa `wayvnc` o la sesión "Xorg" |
| Se ve, pero no responde mouse/teclado | Botón *Solo ver* activo, o macOS sin permiso de control | Desactiva *Solo ver*; en macOS revisa *Compartir pantalla* |
| Muy lento | Red lenta o resolución alta | Baja la resolución del equipo remoto |

### RustDesk

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| "RustDesk no está instalado en este equipo" | Falta el cliente en tu PC | Instálalo de [GitHub](https://github.com/rustdesk/rustdesk/releases/latest) |
| RustDesk abre pero dice *ID does not exist* | La PC remota está apagada, sin internet o registrada en otro servidor | Revisa que ambas usen el mismo *Servidor de ID* y *Key* |
| *Key mismatch* | La clave del cliente no coincide con `id_ed25519.pub` | Copia la clave exacta del servidor en ambos lados |
| Conecta pero va muy lento | Va por relay (hbbr) | Abre 21116/udp en el servidor; revisa el ancho de banda del servidor |
| Pantalla negra en Mac remota | Faltan permisos | Concede *Grabación de pantalla* y *Accesibilidad* a RustDesk |
| No controla la PC Linux | Sesión Wayland | Inicia sesión en *Xorg* |

---

## 📖 Glosario para juniors

| Término | Qué significa aquí |
|---------|--------------------|
| **Proceso main** | La parte de Electron que corre en Node.js (`main.js` + `electron/`). Puede abrir procesos, archivos y puertos. |
| **Proceso renderer** | La ventana donde corre Angular. Es un navegador Chromium. |
| **IPC** | *Inter-Process Communication*: mensajes entre renderer y main (`invoke`, `send`, `on`). |
| **node-pty** | Librería que lanza un programa (aquí `ssh`) como si estuviera en una terminal real. |
| **Túnel SSH (`-L`)** | Hace que un puerto de tu equipo apunte a un puerto del remoto, cifrado por SSH. |
| **`-N`** | Opción de `ssh` para no abrir shell: solo mantiene el túnel. |
| **VNC / RFB** | Protocolo para ver y controlar la pantalla de otro equipo. RFB es el nombre técnico. |
| **noVNC** | Cliente VNC escrito en JavaScript que dibuja la pantalla en un `<canvas>`. |
| **WebSocket** | Conexión bidireccional y persistente que sí puede abrir un navegador (TCP crudo no). |
| **Puente WS ↔ TCP** | Código que recibe WebSocket y reenvía los bytes a un socket TCP, y viceversa. |
| **Puerto 0** | Pedirle al sistema operativo "dame cualquier puerto libre". |
| **Inyección de dependencias** | Un servicio recibe sus colaboradores en el constructor en lugar de crearlos (`container.js`). |
| **Migración** | Sentencia SQL que actualiza la estructura de una base existente sin borrar datos. |
| **RustDesk / hbbs / hbbr** | Escritorio remoto open source; hbbs es el directorio de IDs y hbbr el relay. |
| **NAT** | Lo que hace un router para que varios equipos compartan una IP pública; impide conectarse "hacia adentro" sin configuración. |
| **P2P / relay** | P2P = los dos equipos hablan directo; relay = el tráfico pasa por un servidor intermedio cuando P2P no es posible. |
| **Fingerprint** | Huella del servidor SSH; la primera vez `ssh` pregunta si confías en él. |

---

## 📄 Licencia

Copyright © 2026 **MadXcorp - ADAVAM con el Ing. E. Daniel Valencia Martínez, MSc.** · <https://www.adavam.com>

XSSH Manager es software libre bajo la **GNU General Public License, versión 2 o 3, a tu elección** (`GPL-2.0-only OR GPL-3.0-only`). Textos completos: [LICENSE](LICENSE) (GPL-3.0) y [LICENSE-GPL-2.0](LICENSE-GPL-2.0).

| Puedes | Debes |
|---|---|
| Usar la app, también con fines comerciales | Dar crédito al autor original y conservar el copyright ([NOTICE](NOTICE)) |
| Estudiar y modificar el código | Publicar el código fuente de tus modificaciones bajo `GPL-2.0-only OR GPL-3.0-only` |
| Redistribuirla o venderla | Ofrecer el código fuente completo a quien la reciba |
| | Indicar qué cambiaste y cuándo |

Cualquier mejora o versión derivada debe seguir siendo open source bajo las mismas licencias (GPL-2.0 o GPL-3.0). Para contribuir, consulta [CONTRIBUTING.md](CONTRIBUTING.md).
