export class SocketIOYjsProvider {
  doc: any;
  constructor(doc: any) {
    this.doc = doc;
  }
  connect() {}
  get synced() { return false; }
  destroy() {}
}
