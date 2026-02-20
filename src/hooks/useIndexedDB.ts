import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '../services/database';

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
  const isInitializingRef = useRef(false);
  const keyRef = useRef(key);

  // Update keyRef when key changes
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // Initialize database connection
  useEffect(() => {
    let isMounted = true;

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      return;
    }

    const loadData = async (database: IDBDatabase) => {
      try {
        // Check if object store exists first
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          if (isMounted) {
            setData(null);
            setLoading(false);
            isInitializingRef.current = false;
          }
          return;
        }

        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result;
          if (isMounted) {
            setData(result || null);
            setLoading(false);
            isInitializingRef.current = false;
          }
        };

        request.onerror = () => {
          if (isMounted) {
            setError(new Error('Failed to load data from IndexedDB'));
            setLoading(false);
            isInitializingRef.current = false;
          }
        };

        transaction.onerror = () => {
          if (isMounted) {
            setError(new Error('Transaction failed'));
            setLoading(false);
            isInitializingRef.current = false;
          }
        };
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
          isInitializingRef.current = false;
        }
      }
    };

    const initDB = async () => {
      isInitializingRef.current = true;
      try {
        const database = await getDatabase();
        if (isMounted) {
          setDb(database);
          loadData(database);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
          isInitializingRef.current = false;
        }
      }
    };

    initDB();

    return () => {
      isMounted = false;
    };
  }, [key]); // Re-run effect if key changes to ensure correct data is loaded

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
  }, [db, key]);

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
