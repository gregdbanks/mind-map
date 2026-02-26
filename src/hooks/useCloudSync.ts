import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  pushMapToCloud,
  pullCloudMapList,
  pullMapFromCloud,
  deleteMapFromCloud,
} from '../services/syncService';
import { ApiError, apiClient } from '../services/apiClient';
import type { CloudMapListResponse, CloudSyncState } from '../types/sync';

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
  const planRef = useRef<string>('free');

  const pushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CLOUD_PUSH_DELAY = 5000; // 5s debounce for cloud pushes (local IDB saves remain at 500ms)

  const canSync = isAuthenticated && isOnline;

  // Fetch plan status for sync gating
  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient.getPlanStatus().then((s) => { planRef.current = s.plan; }).catch(() => {});
  }, [isAuthenticated]);

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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (pushDebounceRef.current) clearTimeout(pushDebounceRef.current);
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

    // Don't process queue for downgraded users
    if (planRef.current !== 'pro') {
      setQueue([]);
      saveQueue([]);
      return;
    }

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

  /** Push map to cloud with debounce, or enqueue if offline */
  const pushMap = useCallback((mapId: string): Promise<boolean> => {
    if (!isAuthenticated) return Promise.resolve(false);

    // Downgraded users: edits save locally only
    if (planRef.current !== 'pro') {
      setSyncStatus('idle');
      return Promise.resolve(false);
    }

    if (!isOnline) {
      enqueue(mapId);
      setSyncStatus('offline');
      return Promise.resolve(false);
    }

    // Cancel any pending debounced push — only the latest edit matters
    if (pushDebounceRef.current) {
      clearTimeout(pushDebounceRef.current);
    }

    return new Promise<boolean>((resolve) => {
      pushDebounceRef.current = setTimeout(async () => {
        try {
          setSyncStatus('syncing');
          await pushMapToCloud(mapId);
          setSyncStatus('synced');
          resolve(true);
        } catch (err) {
          // Don't enqueue if it's a plan limit or map not in cloud yet
          if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
            setSyncStatus('idle');
            resolve(false);
            return;
          }
          // Push already in-flight — skip silently, the current push has latest IDB data
          if (err instanceof Error && err.message === 'Push already in progress') {
            resolve(false);
            return;
          }
          setSyncStatus('error');
          enqueue(mapId);
          resolve(false);
        }
      }, CLOUD_PUSH_DELAY);
    });
  }, [isAuthenticated, isOnline, enqueue]);

  /** Explicit "Save to cloud" action for local-only maps */
  const saveToCloud = useCallback(async (mapId: string): Promise<boolean> => {
    if (!canSync) return false;
    try {
      await pushMapToCloud(mapId, true);
      return true;
    } catch {
      return false;
    }
  }, [canSync]);

  /** Fetch cloud map list for dashboard merging (returns maps + plan info) */
  const fetchCloudMaps = useCallback(async (): Promise<CloudMapListResponse> => {
    if (!canSync) return { maps: [], plan: 'free', mapCount: 0, mapLimit: 0 };
    try {
      return await pullCloudMapList();
    } catch {
      return { maps: [], plan: 'free', mapCount: 0, mapLimit: 0 };
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
