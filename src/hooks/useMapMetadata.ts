import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../services/database';
import type { MapMetadata, StoredMindMap, Node } from '../types/mindMap';
import { v4 as uuidv4 } from 'uuid';

export interface UseMapMetadataReturn {
  maps: MapMetadata[];
  loading: boolean;
  error: Error | null;
  createMap: (title?: string) => Promise<string>;
  renameMap: (id: string, title: string) => Promise<void>;
  deleteMap: (id: string) => Promise<void>;
  refreshMaps: () => Promise<void>;
}

export function useMapMetadata(): UseMapMetadataReturn {
  const [maps, setMaps] = useState<MapMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshMaps = useCallback(async (): Promise<void> => {
    try {
      const db = await getDatabase();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mapMetadata'], 'readonly');
        const store = transaction.objectStore('mapMetadata');
        const request = store.getAll();

        request.onsuccess = () => {
          const allMaps = (request.result as MapMetadata[]).slice().sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setMaps(allMaps);
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to load map metadata from IndexedDB'));
        };

        transaction.onerror = () => {
          reject(new Error('Transaction failed while loading map metadata'));
        };
      });
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Load all map metadata on mount
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const db = await getDatabase();

        const transaction = db.transaction(['mapMetadata'], 'readonly');
        const store = transaction.objectStore('mapMetadata');
        const request = store.getAll();

        request.onsuccess = () => {
          if (!isMounted) return;
          const allMaps = (request.result as MapMetadata[]).slice().sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setMaps(allMaps);
          setLoading(false);
        };

        request.onerror = () => {
          if (!isMounted) return;
          setError(new Error('Failed to load map metadata from IndexedDB'));
          setLoading(false);
        };

        transaction.onerror = () => {
          if (!isMounted) return;
          setError(new Error('Transaction failed while loading map metadata'));
          setLoading(false);
        };
      } catch (err) {
        if (!isMounted) return;
        setError(err as Error);
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const createMap = useCallback(async (title?: string): Promise<string> => {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();
      const mapTitle = title ?? 'Untitled Mind Map';

      const metadata: MapMetadata = {
        id,
        title: mapTitle,
        createdAt: now,
        updatedAt: now,
        nodeCount: 1,
      };

      const rootNode: Node = {
        id: `root-${id}`,
        text: mapTitle,
        x: 600,
        y: 400,
        collapsed: false,
        parent: null,
      };

      const storedMap: StoredMindMap = {
        id,
        nodes: [rootNode],
        links: [],
        lastModified: now,
      };

      const db = await getDatabase();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mapMetadata', 'mindmaps'], 'readwrite');

        transaction.onerror = () => {
          reject(new Error('Transaction failed while creating map'));
        };

        transaction.onabort = () => {
          reject(new Error('Transaction aborted while creating map'));
        };

        const metaStore = transaction.objectStore('mapMetadata');
        const mapsStore = transaction.objectStore('mindmaps');

        const metaRequest = metaStore.put(metadata);
        metaRequest.onerror = () => {
          reject(new Error('Failed to store map metadata'));
        };

        const mapRequest = mapsStore.put(storedMap, `map-${id}`);
        mapRequest.onerror = () => {
          reject(new Error('Failed to store map data'));
        };

        transaction.oncomplete = () => {
          resolve();
        };
      });

      await refreshMaps();
      return id;
    } catch (err) {
      const e = err as Error;
      setError(e);
      throw e;
    }
  }, [refreshMaps]);

  const renameMap = useCallback(async (id: string, title: string): Promise<void> => {
    try {
      const db = await getDatabase();

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mapMetadata'], 'readwrite');

        transaction.onerror = () => {
          reject(new Error('Transaction failed while renaming map'));
        };

        transaction.onabort = () => {
          reject(new Error('Transaction aborted while renaming map'));
        };

        const store = transaction.objectStore('mapMetadata');
        const getRequest = store.get(id);

        getRequest.onerror = () => {
          reject(new Error(`Failed to retrieve map metadata for id "${id}"`));
        };

        getRequest.onsuccess = () => {
          const existing = getRequest.result as MapMetadata | undefined;
          if (!existing) {
            reject(new Error(`Map with id "${id}" not found`));
            return;
          }

          const updated: MapMetadata = {
            ...existing,
            title,
            updatedAt: new Date().toISOString(),
          };

          const putRequest = store.put(updated);
          putRequest.onerror = () => {
            reject(new Error('Failed to update map metadata'));
          };
        };

        transaction.oncomplete = () => {
          resolve();
        };
      });

      await refreshMaps();
    } catch (err) {
      const e = err as Error;
      setError(e);
      throw e;
    }
  }, [refreshMaps]);

  const deleteMap = useCallback(async (id: string): Promise<void> => {
    try {
      const db = await getDatabase();

      // Collect all note keys for this map first using a readonly transaction,
      // then delete everything in a readwrite transaction.
      const noteKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        const transaction = db.transaction(['mapNotes'], 'readonly');
        const notesStore = transaction.objectStore('mapNotes');
        const mapIdIndex = notesStore.index('mapId');
        const request = mapIdIndex.getAllKeys(id);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error(`Failed to retrieve notes for map "${id}"`));
        };
      });

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['mapMetadata', 'mindmaps', 'mapNotes'], 'readwrite');

        transaction.onerror = () => {
          reject(new Error('Transaction failed while deleting map'));
        };

        transaction.onabort = () => {
          reject(new Error('Transaction aborted while deleting map'));
        };

        const metaStore = transaction.objectStore('mapMetadata');
        const mapsStore = transaction.objectStore('mindmaps');
        const notesStore = transaction.objectStore('mapNotes');

        metaStore.delete(id);
        mapsStore.delete(`map-${id}`);

        for (const key of noteKeys) {
          notesStore.delete(key);
        }

        transaction.oncomplete = () => {
          resolve();
        };
      });

      await refreshMaps();
    } catch (err) {
      const e = err as Error;
      setError(e);
      throw e;
    }
  }, [refreshMaps]);

  return {
    maps,
    loading,
    error,
    createMap,
    renameMap,
    deleteMap,
    refreshMaps,
  };
}
