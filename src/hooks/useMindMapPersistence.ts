import { useEffect, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import { useIndexedDB } from './useIndexedDB';
import type { MindMap, Node } from '../types/mindMap';
import { demoNodes, demoLinks } from '../data/demoMindMap';

const AUTOSAVE_DELAY = 500; // milliseconds
const STORAGE_KEY = 'mindmap-default';

export function useMindMapPersistence() {
  const { state, dispatch } = useMindMap();
  const { data, save, loading, error } = useIndexedDB<MindMap>(STORAGE_KEY);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<Date>(new Date());
  const hasLoadedRef = useRef(false);
  
  // If IndexedDB fails completely, just continue without persistence
  const isIndexedDBError = error && (
    error.message.includes('Failed to open IndexedDB') ||
    error.message.includes('Failed to execute \'transaction\'')
  );

  // Load data from IndexedDB on mount, or demo data if no saved data
  useEffect(() => {
    if (!loading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      if (data && data.nodes.length > 0) {
        // Convert array to Map for nodes
        const nodes = data.nodes;
        
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes, links: data.links }
        });
        
        lastSavedRef.current = new Date(data.lastModified);
      } else {
        // No saved data, load demo
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes: demoNodes, links: demoLinks }
        });
      }
    }
  }, [loading, data, dispatch]);

  // Auto-save when state changes
  useEffect(() => {
    // Don't save if we're still loading or if there's no data
    if (loading || state.nodes.size === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves
    saveTimeoutRef.current = setTimeout(async () => {
      // Convert Map to array for storage
      const nodes: Node[] = Array.from(state.nodes.values());
      const mindMapData: MindMap = {
        nodes,
        links: state.links,
        lastModified: state.lastModified
      };

      try {
        await save(mindMapData);
        lastSavedRef.current = new Date();
      } catch (err) {
        // Only log error if it's not about initialization
        if (err instanceof Error && err.message !== 'Database not initialized') {
          console.error('Failed to save mind map:', err);
        }
        // If database not initialized, retry after a short delay
        if (err instanceof Error && err.message === 'Database not initialized') {
          setTimeout(async () => {
            try {
              await save(mindMapData);
              lastSavedRef.current = new Date();
            } catch (retryErr) {
              console.error('Failed to save mind map after retry:', retryErr);
            }
          }, 500);
        }
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.nodes, state.links, state.lastModified, save, loading]);

  return {
    loading: isIndexedDBError ? false : loading,
    error: isIndexedDBError ? null : error,
    lastSaved: lastSavedRef.current
  };
}