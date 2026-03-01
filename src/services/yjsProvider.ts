import * as Y from 'yjs';
import { collabSocket } from './collabSocket';
import type { Socket } from 'socket.io-client';

export class SocketIOYjsProvider {
  doc: Y.Doc;
  private socket: Socket | null = null;
  private _synced = false;
  private _destroyed = false;

  // Named handler refs for targeted removal in destroy()
  private _handleSyncStep1: ((data: ArrayBuffer) => void) | null = null;
  private _handleSyncStep2: ((data: ArrayBuffer) => void) | null = null;
  private _handleYjsUpdate: ((data: ArrayBuffer) => void) | null = null;

  // Update batching — coalesce rapid-fire local updates into a single emit
  private _pendingUpdates: Uint8Array[] = [];
  private _batchTimer: ReturnType<typeof setTimeout> | null = null;
  private static BATCH_DELAY = 50; // ms

  constructor(doc: Y.Doc) {
    this.doc = doc;
  }

  connect() {
    this.socket = collabSocket.getSocket();
    if (!this.socket) return;

    // Handler: server sends its state vector (sync step 1)
    // Respond with our diff as sync step 2
    this._handleSyncStep1 = (data: ArrayBuffer) => {
      if (this._destroyed) return;
      const serverStateVector = new Uint8Array(data);
      // Compute diff: only changes server doesn't have
      const update = Y.encodeStateAsUpdate(this.doc, serverStateVector);
      this.socket?.emit('yjs-sync-step2', update);
    };

    // Handler: server sends its diff (sync step 2)
    this._handleSyncStep2 = (data: ArrayBuffer) => {
      if (this._destroyed) return;
      const update = new Uint8Array(data);
      Y.applyUpdate(this.doc, update, 'remote');
      this._synced = true;
    };

    // Handler: incremental updates from other clients (relayed by server)
    this._handleYjsUpdate = (data: ArrayBuffer) => {
      if (this._destroyed) return;
      const update = new Uint8Array(data);
      Y.applyUpdate(this.doc, update, 'remote');
    };

    this.socket.on('yjs-sync-step1', this._handleSyncStep1);
    this.socket.on('yjs-sync-step2', this._handleSyncStep2);
    this.socket.on('yjs-update', this._handleYjsUpdate);

    // Send local changes to server
    this.doc.on('update', this._onDocUpdate);

    // Initiate sync: send our state vector as sync step 1
    const stateVector = Y.encodeStateVector(this.doc);
    this.socket.emit('yjs-sync-step1', stateVector);
  }

  private _onDocUpdate = (update: Uint8Array, origin: unknown) => {
    if (this._destroyed) return;
    // Only send updates that originated locally (not from remote)
    if (origin !== 'remote') {
      this._pendingUpdates.push(update);
      if (!this._batchTimer) {
        this._batchTimer = setTimeout(() => this._flushUpdates(), SocketIOYjsProvider.BATCH_DELAY);
      }
    }
  };

  private _flushUpdates() {
    this._batchTimer = null;
    if (this._pendingUpdates.length === 0 || this._destroyed) return;

    const merged = this._pendingUpdates.length === 1
      ? this._pendingUpdates[0]
      : Y.mergeUpdates(this._pendingUpdates);
    this._pendingUpdates = [];
    this.socket?.emit('yjs-update', merged);
  }

  get synced() {
    return this._synced;
  }

  destroy() {
    this._destroyed = false; // temporarily allow flush
    this._flushUpdates(); // send any pending updates before disconnecting
    this._destroyed = true;
    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }
    this.doc.off('update', this._onDocUpdate);
    if (this.socket) {
      // Remove only our specific handlers, not all listeners
      if (this._handleSyncStep1) this.socket.off('yjs-sync-step1', this._handleSyncStep1);
      if (this._handleSyncStep2) this.socket.off('yjs-sync-step2', this._handleSyncStep2);
      if (this._handleYjsUpdate) this.socket.off('yjs-update', this._handleYjsUpdate);
    }
    this._handleSyncStep1 = null;
    this._handleSyncStep2 = null;
    this._handleYjsUpdate = null;
  }
}
