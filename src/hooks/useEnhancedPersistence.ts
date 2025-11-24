import { useEffect, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import { useIndexedDB } from './useIndexedDB';
import type { MindMap } from '../types/mindMap';
import { demoNodes, demoLinks } from '../data/demoMindMap';

const AUTOSAVE_DELAY = 500;
const STORAGE_KEY = 'mindmap-default';
const LOCALSTORAGE_KEY = 'mindmap-backup';

export function useEnhancedPersistence() {
  const { state, dispatch } = useMindMap();
  const { data, save, loading, error } = useIndexedDB<MindMap>(STORAGE_KEY);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  
  // Save to localStorage as backup
  const saveToLocalStorage = (mindmap: MindMap) => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(mindmap));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  // Load from localStorage if IndexedDB fails
  const loadFromLocalStorage = (): MindMap | null => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return null;
  };

  // Load data on mount
  useEffect(() => {
    if (!loading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      let loadedData: MindMap | null = null;
      
      // Try IndexedDB first
      if (data && data.nodes.length > 0) {
        loadedData = data;
      }
      // Fall back to localStorage
      else {
        loadedData = loadFromLocalStorage();
      }
      
      if (loadedData && loadedData.nodes.length > 0) {
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes: loadedData.nodes, links: loadedData.links }
        });
      } else {
        // No saved data anywhere, load demo
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes: demoNodes, links: demoLinks }
        });
      }
    }
  }, [loading, data, dispatch]);

  // Auto-save when state changes
  useEffect(() => {
    if (loading || state.nodes.size === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const nodes = Array.from(state.nodes.values());
      const mindMapData: MindMap = {
        id: 'default',
        nodes: nodes,
        links: state.links,
        lastModified: new Date(),
      };

      // Save to both IndexedDB and localStorage
      save(mindMapData).catch((e) => {
        console.error('Failed to save to IndexedDB:', e);
      });
      
      saveToLocalStorage(mindMapData);
      
      dispatch({ type: 'MARK_SAVED' });
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.nodes, state.links, save, dispatch, loading]);

  return { loading, error };
}