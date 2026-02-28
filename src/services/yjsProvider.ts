import * as Y from 'yjs';
import { collabSocket } from './collabSocket';
import type { Socket } from 'socket.io-client';

export class SocketIOYjsProvider {
  doc: Y.Doc;
  private socket: Socket | null = null;
  private roomId: string;
  private _synced = false;
  private _destroyed = false;

  constructor(doc: Y.Doc, roomId: string) {
    this.doc = doc;
    this.roomId = roomId;
  }

  connect() {
    this.socket = collabSocket.getSocket();
    if (!this.socket) return;

    // Listen for sync step 1 from server (server sends its state vector)
    this.socket.on('yjs-sync-step1', (data: ArrayBuffer) => {
      if (this._destroyed) return;
      // Server sent sync step 1 — respond with sync step 2 (our state as update)
      const update = Y.encodeStateAsUpdate(this.doc);
      this.socket?.emit('yjs-sync-step2', update);

      // Also send our sync step 1 to get server's state
      const stateVector = Y.encodeStateVector(this.doc);
      this.socket?.emit('yjs-sync-step1', stateVector);
    });

    // Listen for sync step 2 from server (server sends us its diff)
    this.socket.on('yjs-sync-step2', (data: ArrayBuffer) => {
      if (this._destroyed) return;
      const update = new Uint8Array(data);
      Y.applyUpdate(this.doc, update);
      this._synced = true;
    });

    // Listen for incremental updates from other clients (relayed by server)
    this.socket.on('yjs-update', (data: ArrayBuffer) => {
      if (this._destroyed) return;
      const update = new Uint8Array(data);
      Y.applyUpdate(this.doc, update, 'remote');
    });

    // Send local changes to server
    this.doc.on('update', this._onDocUpdate);
  }

  private _onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (this._destroyed) return;
    // Only send updates that originated locally (not from remote)
    if (origin !== 'remote') {
      this.socket?.emit('yjs-update', update);
    }
  };

  get synced() {
    return this._synced;
  }

  destroy() {
    this._destroyed = true;
    this.doc.off('update', this._onDocUpdate);
    if (this.socket) {
      this.socket.off('yjs-sync-step1');
      this.socket.off('yjs-sync-step2');
      this.socket.off('yjs-update');
    }
  }
}
