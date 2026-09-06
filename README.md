# SSH Manager

Una aplicación de escritorio moderna construida con **Angular 22** y **Electron**, diseñada para administrar y conectarse a múltiples servidores SSH de manera rápida e intuitiva. 

## Características

- **Gestión de Perfiles**: Crea, edita y elimina conexiones SSH con soporte para hosts, puertos personalizados y usuarios.
- **Múltiples Métodos de Autenticación**: Soporta tanto contraseñas (interactivas) como llaves privadas (`.pem`, `id_rsa`).
- **Terminal Integrada**: Interfaz de terminal completa renderizada con `xterm.js` dentro de la misma aplicación, conectada directamente a los procesos del sistema (`bash` o `powershell`) a través de `node-pty`.
- **Almacenamiento Local Seguro**: Todos tus perfiles y configuraciones se guardan localmente utilizando una base de datos `SQLite` robusta (`better-sqlite3`).

## Requisitos Previos

Dado que esta aplicación incluye dependencias nativas (`node-pty` y `better-sqlite3`), necesitas tener instaladas las herramientas de compilación correspondientes en tu sistema antes de instalar las dependencias.

- **Node.js** (v18 o superior)
- **Windows**:
  - Python 3.x instalado.
  - Herramientas de compilación de Visual Studio o instalar mediante npm: 
    ```bash
    npm install -g windows-build-tools
    ```
- **macOS / Linux**:
  - `make`, `gcc`, `g++` instalados.

## Instalación

1. Clona el repositorio o navega a la carpeta del proyecto.
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecución en Modo Desarrollo

Para iniciar la aplicación en modo desarrollo (Angular y Electron en paralelo con live-reloading):

```bash
npm start
```fg

## Arquitectura

- **Frontend (`src/app/`)**: Angular 22 renderiza la interfaz y usa `xterm.js` como visor de la terminal. Envía y recibe mensajes al backend usando IPC (`ipc.service.ts`).
- **Backend (`main.js`)**: El hilo principal de Electron maneja la instancia de la base de datos `SQLite` y el ciclo de vida de los procesos pseudo-terminal (`node-pty`). Esto permite que la terminal de tu SO corra bajo demanda al conectarte y renderice su output en la ventana de Angular.

## Compilar para Producción

Para construir los binarios instalables (ejecutables para Windows, Mac o Linux):

```bash
npm run electron:build
```

Esto generará el paquete final usando `electron-builder` en la carpeta de distribución correspondiente.
