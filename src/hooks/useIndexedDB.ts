import { useState, useEffect, useCallback } from 'react';

const DB_NAME = 'MindMapDB';
const DB_VERSION = 2; // Must match the version in useIndexedDBNotes
const STORE_NAME = 'mindmaps';

export interface UseIndexedDBReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  save: (data: T) => Promise<void>;
  remove: () => Promise<void>;
}

export function useIndexedDB<T>(key: string): UseIndexedDBReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database connection
  useEffect(() => {
    let isMounted = true;
    
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
          if (isMounted) {
            setError(new Error('Failed to open IndexedDB'));
            setLoading(false);
          }
        };
        
        request.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          if (isMounted) {
            // Check if the object store exists
            if (!database.objectStoreNames.contains(STORE_NAME)) {
              // Close the database and reopen with a higher version to trigger upgrade
              database.close();
              const newRequest = indexedDB.open(DB_NAME, database.version + 1);
              
              newRequest.onupgradeneeded = (upgradeEvent) => {
                const upgradedDb = (upgradeEvent.target as IDBOpenDBRequest).result;
                if (!upgradedDb.objectStoreNames.contains(STORE_NAME)) {
                  upgradedDb.createObjectStore(STORE_NAME);
                }
              };
              
              newRequest.onsuccess = (successEvent) => {
                const upgradedDb = (successEvent.target as IDBOpenDBRequest).result;
                if (isMounted) {
                  setDb(upgradedDb);
                  loadData(upgradedDb);
                }
              };
              
              newRequest.onerror = () => {
                if (isMounted) {
                  setError(new Error('Failed to upgrade IndexedDB'));
                  setLoading(false);
                }
              };
            } else {
              setDb(database);
              loadData(database);
            }
          }
        };
        
        request.onupgradeneeded = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          
          // Create mindmaps store if it doesn't exist
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME);
          }
          
          // Create notes store if it doesn't exist (for compatibility with useIndexedDBNotes)
          if (!database.objectStoreNames.contains('notes')) {
            const notesStore = database.createObjectStore('notes', { keyPath: 'nodeId' });
            notesStore.createIndex('createdAt', 'createdAt', { unique: false });
            notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            notesStore.createIndex('isPinned', 'isPinned', { unique: false });
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    const loadData = async (database: IDBDatabase) => {
      try {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = (event) => {
          if (isMounted) {
            setData((event.target as IDBRequest).result || null);
            setLoading(false);
          }
        };
        
        request.onerror = () => {
          if (isMounted) {
            setError(new Error('Failed to load data from IndexedDB'));
            setLoading(false);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };
    
    initDB();
    
    return () => {
      isMounted = false;
      if (db) {
        db.close();
      }
    };
  }, [key]);

  const save = useCallback(async (newData: T): Promise<void> => {
    if (!db) {
      // Return a rejected promise instead of throwing immediately
      return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(newData, key);
        
        request.onsuccess = () => {
          setData(newData);
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error('Failed to save data to IndexedDB'));
        };
        
        transaction.onerror = () => {
          reject(new Error('Transaction failed'));
        };
        
        transaction.onabort = () => {
          reject(new Error('Transaction aborted'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db, key, loading]);

  const remove = useCallback(async (): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          setData(null);
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error('Failed to delete data from IndexedDB'));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, [db, key]);

  return { data, loading, error, save, remove };
}