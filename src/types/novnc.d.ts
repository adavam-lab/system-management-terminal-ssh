/** noVNC no publica tipos de TypeScript: declaramos solo lo que usa RemoteDesktopComponent. */
declare module '@novnc/novnc' {
  export interface RfbCredentials {
    username?: string;
    password?: string;
    target?: string;
  }

  export interface RfbOptions {
    shared?: boolean;
    credentials?: RfbCredentials;
    wsProtocols?: string[];
  }

  export default class RFB extends EventTarget {
    constructor(target: HTMLElement, urlOrChannel: string | WebSocket, options?: RfbOptions);
    scaleViewport: boolean;
    resizeSession: boolean;
    clipViewport: boolean;
    viewOnly: boolean;
    focusOnClick: boolean;
    qualityLevel: number;
    compressionLevel: number;
    disconnect(): void;
    sendCredentials(credentials: RfbCredentials): void;
    sendCtrlAltDel(): void;
    focus(): void;
    blur(): void;
    clipboardPasteFrom(text: string): void;
  }
}
