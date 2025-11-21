import { useState, useEffect, useCallback, useRef } from 'react';

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
  const isInitializingRef = useRef(false);
  const keyRef = useRef(key);
  
  console.log('useIndexedDB hook - key:', key, 'loading:', loading, 'db:', db);

  // Initialize database connection
  useEffect(() => {
    let isMounted = true;
    
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    const initDB = async () => {
      isInitializingRef.current = true;
      console.log('Initializing IndexedDB...');
      try {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
          console.error('IndexedDB not available');
          if (isMounted) {
            setError(new Error('IndexedDB not available'));
            setLoading(false);
          }
          return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        console.log('Opening IndexedDB:', DB_NAME, 'version:', DB_VERSION);
        
        request.onerror = (event) => {
          const error = (event.target as IDBOpenDBRequest).error;
          console.error('Failed to open IndexedDB:', error);
          if (isMounted) {
            setError(new Error(`Failed to open IndexedDB: ${error?.message || 'Unknown error'}`));
            setLoading(false);
            isInitializingRef.current = false;
          }
        };
        
        request.onsuccess = (event) => {
          const database = (event.target as IDBOpenDBRequest).result;
          console.log('Database opened successfully');
          if (isMounted) {
            setDb(database);
            loadData(database);
          }
        };
        
        request.onupgradeneeded = (event) => {
          console.log('Database upgrade needed');
          const database = (event.target as IDBOpenDBRequest).result;
          
          // Create mindmaps store if it doesn't exist
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            console.log('Creating object store:', STORE_NAME);
            database.createObjectStore(STORE_NAME);
          }
          
          // Create notes store if it doesn't exist (for compatibility with useIndexedDBNotes)
          if (!database.objectStoreNames.contains('notes')) {
            console.log('Creating notes store');
            const notesStore = database.createObjectStore('notes', { keyPath: 'nodeId' });
            notesStore.createIndex('createdAt', 'createdAt', { unique: false });
            notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            notesStore.createIndex('isPinned', 'isPinned', { unique: false });
          }
        };
      } catch (err) {
        console.error('Error during DB initialization:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
          isInitializingRef.current = false;
        }
      }
    };
    
    const loadData = async (database: IDBDatabase) => {
      console.log('Loading data for key:', keyRef.current);
      try {
        // Check if object store exists first
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          console.log('Object store does not exist, setting empty data');
          if (isMounted) {
            setData(null);
            setLoading(false);
            isInitializingRef.current = false;
          }
          return;
        }
        
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(keyRef.current);
        
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result;
          console.log('Data loaded:', result ? 'found' : 'not found');
          if (isMounted) {
            setData(result || null);
            setLoading(false);
            isInitializingRef.current = false;
          }
        };
        
        request.onerror = () => {
          console.error('Failed to load data');
          if (isMounted) {
            setError(new Error('Failed to load data from IndexedDB'));
            setLoading(false);
            isInitializingRef.current = false;
          }
        };
        
        transaction.onerror = () => {
          console.error('Transaction failed');
          if (isMounted) {
            setError(new Error('Transaction failed'));
            setLoading(false);
            isInitializingRef.current = false;
          }
        };
      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
          isInitializingRef.current = false;
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
  }, []); // Remove dependencies to prevent re-initialization

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
  }, [db, key]); // Remove loading dependency

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