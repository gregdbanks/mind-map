import { useEffect, useRef, useState } from 'react';
import { getDatabase } from '../services/database';
import { useMindMap } from '../context/MindMapContext';
import { pullMapFromCloud } from '../services/syncService';
import type { MindMap, Node, StoredMindMap } from '../types/mindMap';

const AUTOSAVE_DELAY = 500;

interface MapPersistenceOptions {
  onSaved?: (mapId: string) => void;
}

export function useMapPersistence(mapId: string, options?: MapPersistenceOptions) {
  const { state, dispatch } = useMindMap();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mapNotFound, setMapNotFound] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Reset load flag when switching maps (React Router reuses the component)
  const prevMapIdRef = useRef<string | null>(null);
  if (prevMapIdRef.current !== null && prevMapIdRef.current !== mapId) {
    hasLoadedRef.current = false;
  }
  prevMapIdRef.current = mapId;

  // Load data on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const key = `map-${mapId}`;

    getDatabase()
      .then((db) => {
        return new Promise<void>((resolve, reject) => {
          try {
            const transaction = db.transaction(['mindmaps'], 'readonly');
            const store = transaction.objectStore('mindmaps');
            const request = store.get(key);

            request.onsuccess = async () => {
              const data: StoredMindMap | undefined = request.result;
              if (data && data.nodes && data.nodes.length > 0) {
                dispatch({
                  type: 'LOAD_MINDMAP',
                  payload: { nodes: data.nodes, links: data.links },
                });
                setLoading(false);
                resolve();
              } else {
                // Not in IDB — try pulling from cloud (handles collab invites,
                // shared maps, or maps not yet synced to this device)
                try {
                  await pullMapFromCloud(mapId);
                  // Re-read from IDB after cloud pull
                  const tx2 = db.transaction(['mindmaps'], 'readonly');
                  const req2 = tx2.objectStore('mindmaps').get(key);
                  req2.onsuccess = () => {
                    const cloudData: StoredMindMap | undefined = req2.result;
                    if (cloudData && cloudData.nodes && cloudData.nodes.length > 0) {
                      dispatch({
                        type: 'LOAD_MINDMAP',
                        payload: { nodes: cloudData.nodes, links: cloudData.links },
                      });
                    } else {
                      setMapNotFound(true);
                    }
                    setLoading(false);
                    resolve();
                  };
                  req2.onerror = () => {
                    setMapNotFound(true);
                    setLoading(false);
                    resolve();
                  };
                } catch {
                  // Cloud pull failed — map truly doesn't exist or user has no access
                  setMapNotFound(true);
                  setLoading(false);
                  resolve();
                }
              }
            };

            request.onerror = () => {
              reject(new Error(`Failed to load map "${key}" from IndexedDB`));
            };
          } catch (err) {
            reject(err);
          }
        });
      })
      .catch((err) => {
        setError(err as Error);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Auto-save when state changes
  useEffect(() => {
    if (loading) return;
    if (state.nodes.size === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const key = `map-${mapId}`;
      const nodes: Node[] = Array.from(state.nodes.values());
      const mindMapData: MindMap = {
        nodes,
        links: state.links,
        lastModified: new Date(),
      };

      getDatabase()
        .then((db) => {
          // Save mindmap data
          const txMindmaps = db.transaction(['mindmaps'], 'readwrite');
          const mindmapsStore = txMindmaps.objectStore('mindmaps');
          mindmapsStore.put(mindMapData, key);

          txMindmaps.oncomplete = () => {
            dispatch({ type: 'MARK_CLEAN' });
            options?.onSaved?.(mapId);
          };

          txMindmaps.onerror = () => {
            // Save failed — dirty flag stays true
          };

          // Update mapMetadata entry
          const txMeta = db.transaction(['mapMetadata'], 'readwrite');
          const metaStore = txMeta.objectStore('mapMetadata');
          const getReq = metaStore.get(mapId);

          getReq.onsuccess = () => {
            const existing = getReq.result;
            if (existing) {
              const updated = {
                ...existing,
                updatedAt: new Date().toISOString(),
                nodeCount: nodes.length,
              };
              metaStore.put(updated);
            }
          };

          txMeta.onerror = () => {
            // Metadata update failed — non-critical
          };
        })
        .catch(() => {
          // Save failed — dirty flag stays true so user knows
        });
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.nodes, state.links, mapId, loading]);

  return { loading, error, mapNotFound };
}
