const DB_NAME = 'MindMapDB';
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null;
      reject(
        new Error(
          `Failed to open IndexedDB "${DB_NAME}": ${request.error?.message ?? 'Unknown error'}`
        )
      );
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // ----------------------------------------------------------------
      // v1 → mindmaps store (no keyPath — manual keys like `map-{uuid}`)
      // ----------------------------------------------------------------
      if (!db.objectStoreNames.contains('mindmaps')) {
        db.createObjectStore('mindmaps');
      }

      // ----------------------------------------------------------------
      // v2 → notes store (legacy; kept for migration purposes only)
      // ----------------------------------------------------------------
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'nodeId' });
        notesStore.createIndex('createdAt', 'createdAt', { unique: false });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        notesStore.createIndex('isPinned', 'isPinned', { unique: false });
      }

      // ----------------------------------------------------------------
      // v3 → mapMetadata store and mapNotes store
      // ----------------------------------------------------------------
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('mapMetadata')) {
          const metaStore = db.createObjectStore('mapMetadata', { keyPath: 'id' });
          metaStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('mapNotes')) {
          const mapNotesStore = db.createObjectStore('mapNotes', { keyPath: 'id' });
          mapNotesStore.createIndex('mapId', 'mapId', { unique: false });
          mapNotesStore.createIndex('nodeId', 'nodeId', { unique: false });
          // Compound unique index — one note record per (mapId, nodeId) pair
          mapNotesStore.createIndex('mapId_nodeId', ['mapId', 'nodeId'], { unique: true });
        }
      }
    };

    request.onblocked = () => {
      reject(
        new Error(
          `Opening "${DB_NAME}" is blocked by another open connection. Close other tabs and try again.`
        )
      );
    };
  });

  return dbPromise;
}
