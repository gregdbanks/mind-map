import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../services/database';
import type { NodeNote } from '../types';

const MAP_NOTES_STORE = 'mapNotes';

export interface UseMapNotesReturn {
  notes: Map<string, NodeNote>;
  loading: boolean;
  error: Error | null;
  saveNote: (note: NodeNote) => Promise<void>;
  deleteNote: (nodeId: string) => Promise<void>;
  getNote: (nodeId: string) => NodeNote | undefined;
  clearAllNotes: () => Promise<void>;
}

export function useMapNotes(mapId: string): UseMapNotesReturn {
  const [notes, setNotes] = useState<Map<string, NodeNote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize database connection and load notes for this map
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        if (!window.indexedDB) {
          if (isMounted) {
            setError(new Error('IndexedDB not available'));
            setLoading(false);
          }
          return;
        }

        const database = await getDatabase();

        if (!isMounted) return;
        setDb(database);

        // Load all notes where mapId matches using the 'mapId' index
        const transaction = database.transaction([MAP_NOTES_STORE], 'readonly');
        const store = transaction.objectStore(MAP_NOTES_STORE);
        const index = store.index('mapId');
        const request = index.getAll(mapId);

        request.onsuccess = () => {
          if (!isMounted) return;
          const allNotes = (request.result as NodeNote[]) ?? [];
          const notesMap = new Map<string, NodeNote>();

          allNotes.forEach((note) => {
            note.createdAt = new Date(note.createdAt);
            note.updatedAt = new Date(note.updatedAt);
            notesMap.set(note.nodeId, note);
          });

          setNotes(notesMap);
          setLoading(false);
        };

        request.onerror = () => {
          if (!isMounted) return;
          setError(new Error('Failed to load map notes from IndexedDB'));
          setLoading(false);
        };
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [mapId]);

  const saveNote = useCallback(
    async (note: NodeNote): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Attach mapId to the note before saving
      const noteWithMap: NodeNote = { ...note, mapId };

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([MAP_NOTES_STORE], 'readwrite');
          const store = transaction.objectStore(MAP_NOTES_STORE);

          // Use the compound index ['mapId', 'nodeId'] to check for an existing record
          const index = store.index('mapId_nodeId');
          const lookupRequest = index.get([mapId, note.nodeId]);

          lookupRequest.onsuccess = () => {
            const existing = lookupRequest.result as NodeNote | undefined;
            const recordToSave: NodeNote = existing
              ? { ...existing, ...noteWithMap }
              : noteWithMap;

            const putRequest = store.put(recordToSave);

            putRequest.onsuccess = () => {
              setNotes((prev) => {
                const next = new Map(prev);
                next.set(note.nodeId, recordToSave);
                return next;
              });
              resolve();
            };

            putRequest.onerror = () => {
              reject(new Error('Failed to save map note to IndexedDB'));
            };
          };

          lookupRequest.onerror = () => {
            reject(new Error('Failed to look up existing map note in IndexedDB'));
          };
        } catch (err) {
          reject(err);
        }
      });
    },
    [db, mapId]
  );

  const deleteNote = useCallback(
    async (nodeId: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not initialized');
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([MAP_NOTES_STORE], 'readwrite');
          const store = transaction.objectStore(MAP_NOTES_STORE);

          // Look up the record via compound index ['mapId', 'nodeId']
          const index = store.index('mapId_nodeId');
          const lookupRequest = index.get([mapId, nodeId]);

          lookupRequest.onsuccess = () => {
            const existing = lookupRequest.result as NodeNote | undefined;
            if (!existing) {
              resolve();
              return;
            }

            const deleteRequest = store.delete(existing.id);

            deleteRequest.onsuccess = () => {
              setNotes((prev) => {
                const next = new Map(prev);
                next.delete(nodeId);
                return next;
              });
              resolve();
            };

            deleteRequest.onerror = () => {
              reject(new Error('Failed to delete map note from IndexedDB'));
            };
          };

          lookupRequest.onerror = () => {
            reject(new Error('Failed to look up map note for deletion'));
          };
        } catch (err) {
          reject(err);
        }
      });
    },
    [db, mapId]
  );

  const getNote = useCallback(
    (nodeId: string): NodeNote | undefined => {
      return notes.get(nodeId);
    },
    [notes]
  );

  const clearAllNotes = useCallback(async (): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([MAP_NOTES_STORE], 'readwrite');
        const store = transaction.objectStore(MAP_NOTES_STORE);

        // Only delete notes belonging to this map using the mapId index
        const index = store.index('mapId');
        const cursorRequest = index.openCursor(IDBKeyRange.only(mapId));

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result as IDBCursorWithValue | null;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            setNotes(new Map());
            resolve();
          }
        };

        cursorRequest.onerror = () => {
          reject(new Error('Failed to clear map notes from IndexedDB'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db, mapId]);

  return {
    notes,
    loading,
    error,
    saveNote,
    deleteNote,
    getNote,
    clearAllNotes,
  };
}
