import { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '../services/database';
import type { MapMetadata } from '../types/mindMap';

export interface UseMapTitleReturn {
  title: string;
  loading: boolean;
  rename: (newTitle: string) => Promise<void>;
}

export function useMapTitle(mapId: string): UseMapTitleReturn {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getDatabase()
      .then((db) => {
        const tx = db.transaction(['mapMetadata'], 'readonly');
        const store = tx.objectStore('mapMetadata');
        const request = store.get(mapId);

        request.onsuccess = () => {
          if (!isMounted) return;
          const meta = request.result as MapMetadata | undefined;
          setTitle(meta?.title ?? 'Untitled Map');
          setLoading(false);
        };

        request.onerror = () => {
          if (!isMounted) return;
          setTitle('Untitled Map');
          setLoading(false);
        };
      })
      .catch(() => {
        if (!isMounted) return;
        setTitle('Untitled Map');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapId]);

  const rename = useCallback(
    async (newTitle: string): Promise<void> => {
      const db = await getDatabase();

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['mapMetadata'], 'readwrite');
        const store = tx.objectStore('mapMetadata');
        const getReq = store.get(mapId);

        getReq.onsuccess = () => {
          const existing = getReq.result as MapMetadata | undefined;
          if (!existing) {
            reject(new Error(`Map "${mapId}" not found`));
            return;
          }
          store.put({
            ...existing,
            title: newTitle,
            updatedAt: new Date().toISOString(),
          });
        };

        getReq.onerror = () => reject(new Error('Failed to read map metadata'));
        tx.oncomplete = () => {
          setTitle(newTitle);
          resolve();
        };
        tx.onerror = () => reject(new Error('Failed to rename map'));
      });
    },
    [mapId]
  );

  return { title, loading, rename };
}
