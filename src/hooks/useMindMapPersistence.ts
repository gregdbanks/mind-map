import { useEffect, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import { useIndexedDB } from './useIndexedDB';
import type { MindMap, Node } from '../types/mindMap';
import { demoNodes, demoLinks } from '../data/demoMindMap';

const AUTOSAVE_DELAY = 500; // milliseconds
const STORAGE_KEY = 'mindmap-default';
const LOCALSTORAGE_KEY = 'mindmap-backup';

export function useMindMapPersistence() {
  console.log('useMindMapPersistence hook called');
  const { state, dispatch } = useMindMap();
  const { data, save, loading, error } = useIndexedDB<MindMap>(STORAGE_KEY);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<Date>(new Date());
  const hasLoadedRef = useRef(false);
  
  console.log('Persistence state - loading:', loading, 'data:', data, 'error:', error);
  
  // Save to localStorage as backup
  const saveToLocalStorage = (mindmap: MindMap) => {
    try {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(mindmap));
      console.log('Saved to localStorage as backup');
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  // Load from localStorage if IndexedDB fails
  const loadFromLocalStorage = (): MindMap | null => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        console.log('Loading from localStorage backup');
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    return null;
  };
  
  // If IndexedDB fails completely, just continue without persistence
  const isIndexedDBError = error && (
    error.message.includes('Failed to open IndexedDB') ||
    error.message.includes('Failed to execute \'transaction\'')
  );

  // Load data from IndexedDB on mount, or demo data if no saved data
  useEffect(() => {
    // Set a timeout to load data even if IndexedDB is still loading
    const loadTimeout = setTimeout(() => {
      if (loading && !hasLoadedRef.current) {
        console.log('IndexedDB taking too long, loading from localStorage or demo');
        hasLoadedRef.current = true;
        
        const loadedData = loadFromLocalStorage();
        
        if (loadedData && loadedData.nodes.length > 0) {
          console.log('Loading from localStorage with', loadedData.nodes.length, 'nodes');
          dispatch({
            type: 'LOAD_MINDMAP',
            payload: { nodes: loadedData.nodes, links: loadedData.links }
          });
        } else {
          console.log('No saved data found, loading demo');
          dispatch({
            type: 'LOAD_MINDMAP',
            payload: { nodes: demoNodes, links: demoLinks }
          });
        }
      }
    }, 2000); // Wait 2 seconds before giving up on IndexedDB
    
    if (!loading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      clearTimeout(loadTimeout);
      
      console.log('Loading mind map - data:', data);
      
      let loadedData: MindMap | null = null;
      
      // Try IndexedDB first
      if (data && data.nodes.length > 0) {
        console.log('Found saved data in IndexedDB with', data.nodes.length, 'nodes');
        loadedData = data;
      }
      // Fall back to localStorage
      else {
        loadedData = loadFromLocalStorage();
      }
      
      if (loadedData && loadedData.nodes.length > 0) {
        console.log('Loading saved data with', loadedData.nodes.length, 'nodes');
        // Convert array to Map for nodes
        const nodes = loadedData.nodes;
        
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes, links: loadedData.links }
        });
        
        lastSavedRef.current = new Date(loadedData.lastModified);
      } else {
        // No saved data anywhere, load demo
        console.log('No saved data found, loading demo');
        dispatch({
          type: 'LOAD_MINDMAP',
          payload: { nodes: demoNodes, links: demoLinks }
        });
      }
    }
    
    return () => {
      clearTimeout(loadTimeout);
    };
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
        console.log('Saving mind map with', nodes.length, 'nodes');
        await save(mindMapData);
        lastSavedRef.current = new Date();
        console.log('Save successful to IndexedDB');
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
      
      // Always save to localStorage as backup
      saveToLocalStorage(mindMapData);
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