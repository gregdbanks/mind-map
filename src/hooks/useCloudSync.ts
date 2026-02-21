import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  pushMapToCloud,
  pullCloudMapList,
  pullMapFromCloud,
  deleteMapFromCloud,
} from '../services/syncService';
import type { CloudMapMeta, CloudSyncState } from '../types/sync';

const QUEUE_STORAGE_KEY = 'thoughtnet-sync-queue';

/** Load offline sync queue from localStorage */
function loadQueue(): string[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save offline sync queue to localStorage (deduped) */
function saveQueue(queue: string[]): void {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([...new Set(queue)]));
}

export function useCloudSync() {
  const { isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<CloudSyncState>('idle');
  const [queue, setQueue] = useState<string[]>(loadQueue);
  const processingRef = useRef(false);

  const canSync = isAuthenticated && isOnline;

  // Track online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enqueue a map for later sync
  const enqueue = useCallback((mapId: string) => {
    setQueue((prev) => {
      const next = [...new Set([...prev, mapId])];
      saveQueue(next);
      return next;
    });
  }, []);

  // Process the offline queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || !isAuthenticated || !isOnline) return;
    processingRef.current = true;

    const currentQueue = loadQueue();
    const failed: string[] = [];

    for (const mapId of currentQueue) {
      try {
        await pushMapToCloud(mapId);
      } catch {
        failed.push(mapId);
      }
    }

    setQueue(failed);
    saveQueue(failed);
    processingRef.current = false;
  }, [isAuthenticated, isOnline]);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline && isAuthenticated && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, isAuthenticated, queue.length, processQueue]);

  /** Push map to cloud immediately, or enqueue if offline */
  const pushMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    if (!isOnline) {
      enqueue(mapId);
      setSyncStatus('offline');
      return false;
    }

    try {
      setSyncStatus('syncing');
      await pushMapToCloud(mapId);
      setSyncStatus('synced');
      return true;
    } catch {
      setSyncStatus('error');
      enqueue(mapId);
      return false;
    }
  }, [isAuthenticated, isOnline, enqueue]);

  /** Explicit "Save to cloud" action for local-only maps */
  const saveToCloud = useCallback(async (mapId: string): Promise<boolean> => {
    if (!canSync) return false;
    try {
      await pushMapToCloud(mapId);
      return true;
    } catch {
      return false;
    }
  }, [canSync]);

  /** Fetch cloud map list for dashboard merging */
  const fetchCloudMaps = useCallback(async (): Promise<CloudMapMeta[]> => {
    if (!canSync) return [];
    try {
      return await pullCloudMapList();
    } catch {
      return [];
    }
  }, [canSync]);

  /** Pull a specific cloud map into local IDB */
  const pullMap = useCallback(async (mapId: string): Promise<boolean> => {
    if (!canSync) return false;
    try {
      await pullMapFromCloud(mapId);
      return true;
    } catch {
      return false;
    }
  }, [canSync]);

  /** Delete map from cloud */
  const deleteFromCloud = useCallback(async (mapId: string): Promise<boolean> => {
    if (!canSync) return false;
    try {
      await deleteMapFromCloud(mapId);
      return true;
    } catch {
      return false;
    }
  }, [canSync]);

  return {
    canSync,
    isOnline,
    syncStatus,
    setSyncStatus,
    pendingCount: queue.length,
    pushMap,
    saveToCloud,
    fetchCloudMaps,
    pullMap,
    deleteFromCloud,
  };
}
