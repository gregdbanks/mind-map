import { useState, useEffect, useCallback } from 'react';
import type { NodeNote } from '../types';
import { getDatabase } from '../services/database';

const NOTES_STORE_NAME = 'notes';

export interface UseIndexedDBNotesReturn {
  notes: Map<string, NodeNote>;
  loading: boolean;
  error: Error | null;
  saveNote: (note: NodeNote) => Promise<void>;
  deleteNote: (nodeId: string) => Promise<void>;
  getNote: (nodeId: string) => NodeNote | undefined;
  clearAllNotes: () => Promise<void>;
}

export function useIndexedDBNotes(): UseIndexedDBNotesReturn {
  const [notes, setNotes] = useState<Map<string, NodeNote>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);

  // Initialize database connection and load notes
  useEffect(() => {
    let isMounted = true;

    const loadAllNotes = async (database: IDBDatabase) => {
      try {
        const transaction = database.transaction([NOTES_STORE_NAME], 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
          if (isMounted) {
            const allNotes = (event.target as IDBRequest).result as NodeNote[];
            const notesMap = new Map<string, NodeNote>();

            allNotes.forEach(note => {
              // Convert date strings back to Date objects
              note.createdAt = new Date(note.createdAt);
              note.updatedAt = new Date(note.updatedAt);
              notesMap.set(note.nodeId, note);
            });

            setNotes(notesMap);
            setLoading(false);
          }
        };

        request.onerror = () => {
          if (isMounted) {
            setError(new Error('Failed to load notes from IndexedDB'));
            setLoading(false);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    const initDB = async () => {
      try {
        const database = await getDatabase();
        if (isMounted) {
          setDb(database);
          loadAllNotes(database);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    initDB();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveNote = useCallback(async (note: NodeNote): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([NOTES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.put(note);

        request.onsuccess = () => {
          setNotes(prev => {
            const newNotes = new Map(prev);
            newNotes.set(note.nodeId, note);
            return newNotes;
          });
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to save note to IndexedDB'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  const deleteNote = useCallback(async (nodeId: string): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([NOTES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.delete(nodeId);

        request.onsuccess = () => {
          setNotes(prev => {
            const newNotes = new Map(prev);
            newNotes.delete(nodeId);
            return newNotes;
          });
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to delete note from IndexedDB'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  const getNote = useCallback((nodeId: string): NodeNote | undefined => {
    return notes.get(nodeId);
  }, [notes]);

  const clearAllNotes = useCallback(async (): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([NOTES_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          setNotes(new Map());
          resolve();
        };

        request.onerror = () => {
          reject(new Error('Failed to clear notes from IndexedDB'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

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
