export class SocketIOYjsProvider {
  doc: any;
  constructor(doc: any, _roomId: string) {
    this.doc = doc;
  }
  connect() {}
  get synced() { return false; }
  destroy() {}
}
